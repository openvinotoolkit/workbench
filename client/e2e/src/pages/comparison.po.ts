import { browser, by, element, ElementFinder, protractor } from 'protractor';

import { TestUtils } from './test-utils';

type Side = 'a' | 'b';

export class ComparisonPage {
  private _elements = {
    side: (side: Side) => ({
      side: TestUtils.getElementByDataTestId(`side_${side}`),
      get projectSelector(): ElementFinder {
        return TestUtils.getNestedElementByDataTestId(this.side, 'project-selector');
      },
      getProjectOption(modelName: string, datasetName: string, deviceName: string): ElementFinder {
        return TestUtils.getElementByDataTestId(`${side}_${modelName}_${datasetName}_${deviceName}`);
      },
      get experimentsSelector(): ElementFinder {
        return TestUtils.getNestedElementByDataTestId(this.side, 'experiments-selector');
      },
      getExperimentOption(batch: number, stream: number): ElementFinder {
        return TestUtils.getNestedElementByDataTestId(this.experimentsSelector, `batch:${batch}_stream:${stream}`);
      },
      get experimentOptionsCount(): number {
        return this.experimentsSelector.all(by.css('tbody tr')).count();
      },
      get experimentChartSelector(): ElementFinder {
        return TestUtils.getNestedElementByDataTestId(this.side, 'inference-points-coordinates');
      },
      getExperimentChartOption(batch: number, stream: number): ElementFinder {
        return this.side.$(
          `[${TestUtils.dataTestIdPrefix}="graph-point-element"][batch="${batch}"][stream="${stream}"]`
        );
      },
      get experimentChartOptionsCount(): number {
        return this.experimentChartSelector
          .all(by.css(`[${TestUtils.dataTestIdPrefix}="graph-point-element"]`))
          .count();
      },
    }),
    compareBtn: TestUtils.getElementByDataTestId('compare-btn'),
    barChartTab: TestUtils.getElementByDataTestId('inference-tab'),
    barChart: TestUtils.getElementByDataTestId('bar-chart'),
    layersDistributionTab: TestUtils.getElementByDataTestId('execution-tab'),
    layersDistribution: TestUtils.getElementByDataTestId('layers-distribution-table'),
    layersTableTab: TestUtils.getElementByDataTestId('layers-table-tab'),
    layersTable: TestUtils.getElementByDataTestId('layers-compare-table'),
    backToDashboard: TestUtils.getElementByDataTestId('back-to-dashboard'),
  };

  get layersTableEl(): ElementFinder {
    return element(by.css('wb-layers-compare-table'));
  }

  async selectProject(side: Side, modelName: string, datasetName: string, deviceName: string): Promise<void> {
    console.log(
      `[Comparison page] selecting project side:${side}, model: ${modelName}, dataset: ${datasetName}, device: ${deviceName}`
    );
    const elements = this._elements.side(side);
    await elements.projectSelector.click();
    await browser.wait(elements.getProjectOption(modelName, datasetName, deviceName).isPresent());
    await browser.wait(
      protractor.ExpectedConditions.elementToBeClickable(elements.getProjectOption(modelName, datasetName, deviceName))
    );
    await elements.getProjectOption(modelName, datasetName, deviceName).click();
    await browser.wait(elements.getExperimentOption(1, 1).isPresent());
  }

  async selectExperimentByTable(side: Side, batch: number, stream: number): Promise<void> {
    console.log(`[Comparison page] selecting experiment by table side:${side}, batch: ${batch}, stream: ${stream}`);
    await this._elements.side(side).getExperimentOption(batch, stream).click();
  }

  async selectExperimentByChart(side: Side, batch: number, stream: number): Promise<void> {
    console.log(`[Comparison page] selecting experiment by chart side:${side}, batch: ${batch}, stream: ${stream}`);
    const pointEl = this._elements.side(side).getExperimentChartOption(batch, stream);

    const pointX = parseInt(await pointEl.getAttribute('x'), 10);
    const pointY = parseInt(await pointEl.getAttribute('y'), 10);

    await browser.driver
      .actions()
      .mouseMove(this._elements.side(side).side.$(`[${TestUtils.dataTestIdPrefix}="inference-results-graph"]`), {
        x: pointX,
        y: pointY,
      })
      .click()
      .perform();
  }

  async compare(): Promise<void> {
    console.log('[Comparison page] clicking on compare');
    await this._elements.compareBtn.click();
    await browser.wait(this._elements.barChartTab.isPresent());
  }

  async openLayersTable(): Promise<void> {
    console.log('[Comparison page] opening layers table');
    await this._elements.layersTableTab.click();
    expect(await this._elements.layersTable.isPresent()).toBeTruthy();
  }

  async navigateToDashboard(): Promise<void> {
    console.log('[Comparison page] navigating to dashboard');
    await this._elements.backToDashboard.click();
  }

  async assertTabs(): Promise<void> {
    console.log('[Comparison page] asserting tabs presence');
    await this._elements.barChartTab.click();
    expect(await this._elements.barChart.isPresent()).toBeTruthy();
    await this._elements.layersDistributionTab.click();
    expect(await this._elements.layersDistribution.isPresent()).toBeTruthy();
    await this._elements.layersTableTab.click();
    expect(await this._elements.layersTable.isPresent()).toBeTruthy();
  }

  async assertExperimentsNumber(side: Side, experiments: number): Promise<void> {
    console.log(`[Comparison page] asserting experiments number side:${side}, should be equal to ${experiments}`);
    const el = this._elements.side(side);
    await browser.wait(el.getExperimentOption(1, 1).isPresent());
    expect(el.experimentOptionsCount).toBe(experiments);
    expect(el.experimentChartOptionsCount).toBe(experiments);
  }

  async assertExperimentSelected(side: Side, batch: number, stream: number): Promise<void> {
    console.log(`[Comparison page] asserting selected experiment side:${side}, batch:${batch}, stream:${stream}`);
    const el = this._elements.side(side);
    await browser.wait(el.getExperimentOption(batch, stream).isPresent());

    expect(await el.getExperimentOption(batch, stream).getAttribute('class')).toContain('selected');
    expect(await el.getExperimentChartOption(batch, stream).getAttribute('type')).toContain('selected');
  }
}
