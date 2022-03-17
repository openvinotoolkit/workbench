@ECHO OFF

:: Check if Python is installed
py --version 2>NUL

if %ERRORLEVEL% NEQ 0 (
   echo Error: Python 3 is not installed. Please install Python 3.6 ^(64-bit^) or higher from https://www.python.org/downloads/
   exit /B 1
)

:: Get the Python version
:: for /F = for loop
:: tokens=* = take all tokens from the command in the ()
:: %%F = variable to store the value from the command in the ()
:: USEBACKQ = command contains `
for /F "tokens=* USEBACKQ" %%F IN (`py -c "import sys; print(str(sys.version_info[0])+'.'+str(sys.version_info[1]))" 2^>^&1`) DO (
    set python_version=%%F
)

:: Extract exact versions
:: tokens=1,2 = process first and second elements
:: delims=. = split by "."
:: %%a %%b = variables to store, only need to define %%a as %%b is defined on its own in alphabetical order
for /F "tokens=1,2 delims=. " %%a IN ("%python_version%") DO (
    set major_version=%%a
    set minor_version=%%b
)

set check_python_version=""
if "%major_version%" geq "3" (
    if "%minor_version%" geq "6" (
        set check_python_version="okay"
    )
)

if not %check_python_version%=="okay" (
    echo Error: Unsupported Python version. Please install Python 3.6 ^(64-bit^) or higher from https://www.python.org/downloads/
    exit /B 1
)

py -m pip install -U openvino-workbench

if %ERRORLEVEL% NEQ 0 (
    echo Error: openvino-workbench package could not be installed. There might be a problem with proxies. Please set them in the terminal and try again.
    echo You can find additional information regarding DL Workbench Python starter on the PyPI page: https://pypi.org/project/openvino-workbench/
    echo You can contact our team on the Intel Community Forum: https://community.intel.com/t5/Intel-Distribution-of-OpenVINO/bd-p/distribution-openvino-toolkit
    exit /B 1
)

:: New line
echo.
echo openvino-workbench package installed successfully. You can start DL Workbench with the following command:
echo   openvino-workbench
echo It will start DL Workbench with the default arguments and capabilities. To see the list of available arguments, run the following command:
echo   openvino-workbench --help
echo See documentation for additional information:
echo https://docs.openvinotoolkit.org/latest/workbench_docs_Workbench_DG_Install.html
