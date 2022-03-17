"""
 OpenVINO DL Workbench
 http query string parser

 Copyright (c) 2021 Intel Corporation

 LEGAL NOTICE: Your use of this software and any required dependent software (the “Software Package”) is subject to
 the terms and conditions of the software license agreements for Software Package, which may also include
 notices, disclaimers, or license terms for third party or open source software
 included in or with the Software Package, and your use indicates your acceptance of all such terms.
 Please refer to the “third-party-programs.txt” or other similarly-named text file included with the Software Package
 for additional details.
 You may obtain a copy of the License at
      https://software.intel.com/content/dam/develop/external/us/en/documents/intel-openvino-license-agreements.pdf
"""
import enum
from abc import ABC
from typing import Tuple, List, Dict, Callable, Set, Union, NamedTuple

from sqlalchemy import desc, asc
from sqlalchemy.orm import Query
from sqlalchemy.sql.operators import ColumnOperators
from sqlalchemy.sql.type_api import TypeEngine
from werkzeug.datastructures import ImmutableMultiDict

from wb.error.request_error import BadRequestError
from wb.main.models.base_model import BaseModel

RESERVED_QUERY_STRING_KEYS = ['order_by', 'page', 'size', 'count']


class QueryableColumnLike(ABC, ColumnOperators):
    type: TypeEngine


class QueryApiModel:
    """
    An interface for query api requests processing. Used for:
        1. query string parameters validation and casting
        2. building filter, having, order functions
        3. query results json conversion

    query: Sql Alchemy query. Accepted values:
        Model.query                           : sql alchemy model query
        query.with_entities(...).group_by(...): user defined expression:

    columns: Queryable columns. Accepted values:
        Model.id                                  : model column defined as id = Column(Integer, ...)
        func.sum(BaseModel.matches).label(matches): aggregate sql alchemy function

    to_json: Function which convert query output to python dict. Accepted value is function.
        Function (BaseModel subclass) -> dict in case of model query
        Function (tuple) -> dict in case if custom query
    aggregated_columns: Set of column names which were aggregated and thus operations (comparing, ordering)
    on such columns should be done in HAVING expression
    """
    query: Query
    columns: Dict[str, QueryableColumnLike]
    to_json: Callable[[Union[BaseModel, NamedTuple]], dict]
    aggregated_columns: Set[str]

    def __init__(
            self,
            query: Query,
            columns: Dict[str, QueryableColumnLike],
            to_json: Callable[[Union[BaseModel, NamedTuple]], dict],
            aggregated_columns: Set[str] = None,
    ):
        self.query = query
        self.columns = columns
        self.to_json = to_json
        self.aggregated_columns = aggregated_columns


class FilterOperator(enum.Enum):
    eq = 'eq'
    neq = 'neq'
    gt = 'gt'
    gte = 'gte'
    lt = 'lt'
    lte = 'lte'
    like = 'like'


def _parse_filters(query_api: QueryApiModel, parameters: ImmutableMultiDict) -> Tuple[List, List]:
    """
    Return filter sqlalchemy functions built based on request query string
    Syntax:
    ?column_name=operator value
    column_name: supported by model FILTERABLE_COLUMNS
    operator: eq | neq | gt | gte | lt | lte | like
    value: type convertable based on column type
    Example:
    ?class_id=gte 2&precision=gt 0.5&image_name=like 336232
    """
    supported_operators = ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'like']

    filter_keys = [qs for qs in parameters.keys() if qs not in RESERVED_QUERY_STRING_KEYS]

    filter_fns = []
    having_fns = []
    for filter_key in filter_keys:
        if filter_key not in query_api.columns.keys():
            raise BadRequestError('Bad filter name')

        filter_expression = parameters.get(filter_key)

        if filter_expression.count(' ') != 1:
            raise BadRequestError('Bad filter syntax')

        filter_operator, filter_value = filter_expression.split(' ')

        if filter_operator not in supported_operators:
            raise BadRequestError('Bad filter operator')

        if not filter_value:
            raise BadRequestError('Bad filter value')

        table_column = query_api.columns.get(filter_key)

        try:
            # convert string to column python type which is int, float, str...
            filter_value = table_column.type.python_type(filter_value)
        except ValueError:
            raise BadRequestError(f'Bad filter {filter_key} value type, expected: {table_column.type.python_type}')

        filter_fn = None
        # comparison operations is overloaded for table_column
        if filter_operator == FilterOperator.eq.value:
            filter_fn = table_column == filter_value
        if filter_operator == FilterOperator.neq:
            filter_fn = table_column != filter_value
        if filter_operator == FilterOperator.gt.value:
            filter_fn = table_column > filter_value
        if filter_operator == FilterOperator.gte.value:
            filter_fn = table_column >= filter_value
        if filter_operator == FilterOperator.lt.value:
            filter_fn = table_column < filter_value
        if filter_operator == FilterOperator.lte.value:
            filter_fn = table_column <= filter_value
        if filter_operator == FilterOperator.like.value:
            filter_fn = table_column.like(f'%{filter_value}%')

        if not query_api.aggregated_columns or filter_key not in query_api.aggregated_columns:
            filter_fns.append(filter_fn)
        else:
            having_fns.append(filter_fn)

    return filter_fns, having_fns


def _parse_order_by(query_api: QueryApiModel, parameters: ImmutableMultiDict):
    """
    Return order by sqlalchemy function built based on request query string
    Syntax:
    ?order_by=column_name direction
    column_name: supported by model FILTERABLE_COLUMNS
    direction: asc | desc
    Example:
    ?order_by=name asc
    ?order_by=precision desc
    """
    order_by_expression = parameters.get('order_by')

    if not order_by_expression:
        return None

    if order_by_expression.count(' ') != 1:
        raise BadRequestError('Bad order by syntax')

    column_name, direction = order_by_expression.split(' ')

    if column_name not in query_api.columns.keys():
        raise BadRequestError('Bad order by column')

    if direction not in ['asc', 'desc']:
        raise BadRequestError('Bad order by direction')

    order_fn = asc if direction == 'asc' else desc

    return order_fn(query_api.columns.get(column_name))


def _parse_pagination(parameters: ImmutableMultiDict) -> Tuple[int, int, bool]:
    """
    Return page size built based on request query string
    Syntax:
    ?page=page_number&size=page_size&count=bool
    page_number: int convertable
    page_size: int convertable
    count: bool convertable
    Example:
    ?page=0&size=20&count=true
    ?page=0&size=20
    """
    try:
        page = int(parameters.get('page', 0))
    except ValueError:
        raise BadRequestError('Bad page value type')
    try:
        size = int(parameters.get('size', 20))
    except ValueError:
        raise BadRequestError('Bad size value type')

    count = parameters.get('count', 'false') == 'true'

    return page, size, count


def parse_query_string_parameters(query_model: QueryApiModel, parameters: ImmutableMultiDict):
    filter_fn, having_fn = _parse_filters(query_model, parameters)
    order_by_fns = _parse_order_by(query_model, parameters)
    page, size, count = _parse_pagination(parameters)

    return filter_fn, having_fn, order_by_fns, page, size, count
