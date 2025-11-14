A "Dataweb is in data load mode" error appears while new data is being loaded. The API is unavailable during this period.
Getting Started
First, we need to import the necessary python libraries...

import pandas as pd      # primary library for managing and manipulating data
import requests          # library for calling API endpoints
... and configure important variables and settings.

token = '[Get your token from the API tab in Dataweb (requires login)]'
baseUrl = 'https://datawebws.usitc.gov/dataweb'
headers = {
    "Content-Type": "application/json; charset=utf-8", 
    "Authorization": "Bearer " + token
}

requests.packages.urllib3.disable_warnings() 
Set starting query
Use the basic query provided at the bottom of the document. This is a basic template that can be made more complicated with the various steps throughout this guide.

requestData = basicQuery
... or we can get one of our saved queries. NB: these are based on the user linked to the provided token.

Important Note: If you are having trouble creating your own API request because you can't find the specific field you are looking for, you can use the "getAllSavedQueries" endpoint shown below to get the exact query you need. You have to specifically save this query through Dataweb so it is tied to your account. You will then see the details of the query through this endpoint and can copy any information you need.

response = requests.get(baseUrl+"/api/v2/savedQuery/getAllSavedQueries", 
                        headers=headers, verify=False)
response
Calling the API (first basic query)
At this point, we have enough to get the data based on our basic query. Let's submit the query to the API.

response = requests.post(baseUrl+'/api/v2/report2/runReport', 
                         headers=headers, json=requestData, verify=False)
Let's restructure the data into a tabular form. We are doing it manually this time to show what goes into restructuring the data, specifically this dataset with 3 columns. However, there is also a more dynamic function at the end of this document that extracts the data from the JSON regardless of schema, and it will be used in subsequent examples.

columns = []
columns.append(response.json()['dto']['tables'][0]['column_groups'][0]['columns'][0]['label'])
columns.append(response.json()['dto']['tables'][0]['column_groups'][1]['columns'][0]['label'])
columns.append(response.json()['dto']['tables'][0]['column_groups'][1]['columns'][1]['label'])

data = [[x[0]['value'], x[1]['value'], x[2]['value']] for x in [x['rowEntries'] 
                        for x in response.json()['dto']['tables'][0]['row_groups'][0]['rowsNew']]]

df = pd.DataFrame(data, columns = columns)

df.head() # Shows first 5 rows in table
Now that we've seen how to run a basic query and access our saved queries, let's look how to make simple modifications to an existing query and resend to the API.

Not all manual updates to queries will be able to be processed by the API. If you run into problems, consider creating a saved query in the dataweb application, which applies the appropriate data validations and dependencies.

Updating Existing Queries
The following steps are designed to match 1-to-1 with the query creation steps in the DataWeb application.

Step 1: Trade Flow and Classification System
In this step you can choose between different summable measures of the data you wish to view. First let's copy a basic Dataweb query, so we can make sure we working with the correct structure for the query object.

More information for the endpoints used in Step 1 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
tfcsExampleQuery = basicQuery.copy()
Trade Flow Options
Import: Imports for Consumption
Export: Domestic Exports
GenImp: General Imports
TotExp: Total Exports
Balance: Trade Balance
ForeignExp: Foreign Exports
ImpExp: Imports and Exports
Additional descriptions of each option can be found here https://dataweb.usitc.gov/assets/content/query-builder/trade-flow.help.md

tfcsExampleQuery['reportOptions']['tradeType'] = 'Import'
Classification System Options
QUICK: Quick Query
HTS: HTS Items
SIC: SIC Codes (1989-2001)
SITC: SITC Codes
NAIC: NAICS Codes (1997-present)
EXPERT: Expert Mode
Additional descriptions of each option can be found here https://dataweb.usitc.gov/assets/content/query-builder/classification-system.help.md

tfcsExampleQuery['reportOptions']['classificationSystem'] = 'HTS'
response = requests.post(baseUrl+"/api/v2/report2/runReport", 
                         headers=headers, json=tfcsExampleQuery, verify=False)
response
Note: The "printQueryResults" function is defined at the bottom of the document

printQueryResults(headers, requestData).head()
Step 2: Data and Years
Data periods can be selected a few different ways. Check out the examples of how to use the date parameters to customize your query below. First, resetting the query back to the basic query.

More information for the endpoints used in Step 2 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
timeFrameExample = basicQuery.copy()
To select entire years, set timeframeSelectType to fullYears and provide the list of years in years. Setting yearsTimeline to Annual will aggregate the data by calendar year.

timeFrameExample['searchOptions']['componentSettings']['timeframeSelectType'] = 'fullYears'
timeFrameExample['searchOptions']['componentSettings']['years'] = ['2020', '2021', '2022', '2023']
timeFrameExample['searchOptions']['componentSettings']['yearsTimeline'] = 'Annual'
yearsTimeline can also be set to Monthly

timeFrameExample['searchOptions']['componentSettings']['timeframeSelectType'] = 'fullYears'
timeFrameExample['searchOptions']['componentSettings']['years'] = ['2023']
timeFrameExample['searchOptions']['componentSettings']['yearsTimeline'] = 'Monthly'
More precise date ranges can be selected by setting startDate and endDate fields in MM/YYYY format. To select the date range using these fields, you will also need to set timeframeSelectType to specificDateRange

timeFrameExample['searchOptions']['componentSettings']['startDate'] = '06/2022'
timeFrameExample['searchOptions']['componentSettings']['endDate'] = '10/2023'
timeFrameExample['searchOptions']['componentSettings']['timeframeSelectType'] = 'specificDateRange'
timeFrameExample['searchOptions']['componentSettings']['yearsTimeline'] = 'Monthly'
Let's check out the results...

printQueryResults(headers, timeFrameExample).head()
Step 3: Countries
Countries can be specified in the query in a couple of different ways. The first is to select individual countries manually, but you can also select specific country groups that are managed by the Dataweb application or groups that you saved to your Dataweb user account.

More information for the endpoints used in Step 3 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
Get All Countries: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Countries/getAllCountries
Get User's Country Saved Country Groups: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Countries/getAllUserGroupsWithCountries
countriesExampleQuery = basicQuery.copy()
The first option is to retrieve the list of countries...

response = requests.get(baseUrl+"/api/v2/country/getAllCountries", 
                         headers=headers, verify=False)
df = pd.DataFrame(response.json()['options'])
df.head()
... and select those countries we are interested in ...

countries = []
countries.append(response.json()['options'][1])
countries.append(response.json()['options'][4])
... and add those countries to our example query

countriesExampleQuery['searchOptions']['countries']['countries'] = [x['value'] for x in countries]
The final option is to load a country group that you saved under your Dataweb user account.

response = requests.get(baseUrl+"/api/v2/country/getAllUserGroupsWithCountries", 
                         headers=headers, verify=False)
response.json()
Select the the saved country group(s) you would like to use

countryGroups = []
countryGroups.append(response.json['options'][0])
countryGroups.append(response.json['options'][1])
countryGroups
Update the query to use the selected groups

countriesExampleQuery['searchOptions']['countries']['countryGroups'] = [x['value'] for x in countryGroups]
Let's check out the data

printQueryResults(headers, countriesExampleQuery).head()
Note: You can change the aggregation level for by changing the value of 'aggregation'. This can be done for countries (as seen below), but also any of the other search criteria.

countriesExampleQuery['searchOptions']['countries']['aggregation']='Break Out Countries'

printQueryResults(headers, countriesExampleQuery).head()
Step 4: Commodities
Similar to countries, commodities can be selected using Dataweb-managed groups or specific commodity groups you saved to your Dataweb user account.

More information for the endpoints used in Step 4 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
Get All System-Managed Commodity Groups: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Commodities/getAllSystemGroupsWithCommodities
Get All User-Saved Commodity Groups: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Commodities/getAllUserGroupsWithCommodities
commoditiesExampleQuery = basicQuery.copy()
options = {'tradeType': "Import", 'classificationSystem': "HTS", 'timeframesSelectedTab': "fullYears"}
response = requests.post(baseUrl+"/api/v2/commodity/getAllSystemGroupsWithCommodities", 
                         headers=headers, json=options, verify=False)
response.json()
Note: there are currently NO system-managed commodity groups

response = requests.post(baseUrl+"/api/v2/commodity/getAllUserGroupsWithCommodities", 
                         headers=headers, json=options, verify=False)
Let's select the first commodity group...

commodityGroups = []
commodityGroups.append(response.json['options'][0])
... and add it to the query

commoditiesExampleQuery['searchOptions']['commodities']['commodityGroups'] = [x['value'] for x in commodityGroups]
Let's check out the data

printQueryResults(headers, commoditiesExampleQuery).head()
Step 5: Programs
Programs are not available when you select Domestic Exports, Total Exports, General Imports, Foreign Exports, or Trade Balance under Trade Flow in Step 1.

To select Programs, please select Imports For Consumption under Trade Flow in Step 1.

To start, let's reset the query to the basic.

More information for the endpoints used in Step 5 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
Get Program List: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Query%20Info/getImportPrograms
programsExampleQuery = basicQuery.copy()
Dataweb manages a list of programs, the list of which can be retrieved through the getImportPrograms endpoint...

response = requests.post(baseUrl+"/api/v2/query/getImportPrograms", 
                         json={"tradeType":"Import"}, headers=headers, verify=False)
Let's look at the first 5 rows of the data to see what it looks like

df = pd.DataFrame(response.json()['options'])
df.head()
programs = []
programs.append(response.json()['options'][3])
Update the request with the program information...

programsExampleQuery['searchOptions']['MiscGroup']['extImportPrograms']['aggregation'] = 'Aggregate CSC' # or 'Break Out CSC'
programsExampleQuery['searchOptions']['MiscGroup']['extImportPrograms']['extImportPrograms'] = [x['value'] for x in programs]
programsExampleQuery['searchOptions']['MiscGroup']['extImportPrograms']['extImportProgramsExpanded'] = []
programsExampleQuery['searchOptions']['MiscGroup']['extImportPrograms']['programsSelectType'] = 'list'
printQueryResults(headers, programsExampleQuery).head()
Step 6: Rate Provision Codes
Rate Provision codes can also be added to queries. A list of RP codes can be retrieved using getRPCodesList. An example follows, but first we'll reset our query back to the basic query provided at the end of this document.

More information for the endpoints used in Step 6 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
Get Rate Provision Code List: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Query%20Info/getRPCodesList
rateProvisionExample = basicQuery.copy()
Now, let's get a list of saved RPCodes ...

response = requests.post(baseUrl+"/api/v2/query/getRPCodesList", 
                         headers=headers, json={"tradeType":"Import"}, verify=False)
df = pd.DataFrame(response.json()['options'])
df.head()
... select the ones we would like to use ...

rpCodes = []
rpCodes.append(response.json()['options'][4])
... and add them to our query

rateProvisionExample['searchOptions']['MiscGroup']['provisionCodes']['provisionCodesSelectType'] = 'list'
rateProvisionExample['searchOptions']['MiscGroup']['provisionCodes']['rateProvisionCodes'] = [x['value'] for x in rpCodes]
rateProvisionExample['searchOptions']['MiscGroup']['provisionCodes']['rateProvisionCodesExpanded'] = rpCodes
printQueryResults(headers, rateProvisionExample).head()
Step 7: Districts
Districts can be added in one of two ways:

As a user-saved group
Individually by ID
An example of each option can be found below, but first, let's reset our query back to the basic query example.

More information for the endpoints used in Step 7 can be found in Swagger:

Run Report: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Run%20Query/runReport
Get User-Saved District Groups: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Districts/getAllUserGroupsWithDistricts
Get List of All Districts: https://datawebws.usitc.gov/dataweb/swagger-ui/index.html#/Districts/getAllDistricts
districtsExample = basicQuery.copy()
If the user associated with the token being used has previously saved district groups under their account in Dataweb, then the district group(s) can be retrieved with getAllUserGroupsWithDistricts

response = requests.get(baseUrl+"/api/v2/district/getAllUserGroupsWithDistricts", 
                        headers=headers,verify=False)
response.json()
One or more district groups can be selected. In our example, we will just grab the first one

districtGroups = []
districtGroups.append(response.json()[0])
Now, we can update our query parameters to use the District Group(s) we selected

districtsExample['searchOptions']['MiscGroup']['districts']['districtGroups']['userGroups'] = districtGroups
Otherwise, a full list of districts can be downloaded using getAllDistricts

response = requests.get(baseUrl+"/api/v2/district/getAllDistricts", 
                        headers=headers, verify=False)
In this example, we will just use grab the first two districts

districts = []
districts.append(response.json()['options'][0])
districts.append(response.json()['options'][1])
districts
With the districts selected, we just have to update the query to include them. Note that there are multiple values that need to be updated.

districtsExample['searchOptions']['MiscGroup']['districts']['districts'] = [x['value'] for x in districts]
districtsExample['searchOptions']['MiscGroup']['districts']['districtsExpanded'] = districts
districtsExample['searchOptions']['MiscGroup']['districts']['districtsSelectType'] = 'list'
printQueryResults(headers, districtsExample).head()
API Documentation References
Print Query Function
This is a simple function designed to be used with the examples above, mostly to avoid copying/pasting the same lines of code over and over again. Note: it is NOT designed to work in most or all cases.

def printQueryResults(headers, requestData):
    response = requests.post(baseUrl+"/api/v2/report2/runReport", 
                            headers=headers, json=requestData, verify=False)

    columns = getColumns(response.json()['dto']['tables'][0]['column_groups'])

    data = getData(response.json()['dto']['tables'][0]['row_groups'][0]['rowsNew'])

    df = pd.DataFrame(data, columns = columns)

    return df
Support function to extract column names

def getColumns(columnGroups, prevCols = None):
    if prevCols is None:
        columns = []
    else:
        columns = prevCols
    for group in columnGroups:
        if isinstance(group, dict) and 'columns' in group.keys():
            getColumns(group['columns'], columns)
        elif isinstance(group, dict) and 'label' in group.keys():
            columns.append(group['label'])
        elif isinstance(group, list):
            getColumns(group, columns)
    return columns
Support function to extract data values from JSON

def getData(dataGroups):
    data = []
    for row in dataGroups:
        rowData = []
        for field in row['rowEntries']:
            rowData.append(field['value'])
        data.append(rowData)
    return data

Sample API Request
Below is a basic example of the query object that needs to be sent to the API for it to process and return query results. It is added here to represent the structure of Dataweb query objects, serve as a basis for the previous API examples, and facilitate simple user queries.

Note: user-saved or system queries can be used in lieu of and as a replacement for this query object.

basicQuery = {
    "savedQueryName":"",
    "savedQueryDesc":"",
    "isOwner":True,
    "runMonthly":False,
    "reportOptions":{
        "tradeType":"Import",
        "classificationSystem":"HTS"
    },
    "searchOptions":{
        "MiscGroup":{
            "districts":{
                "aggregation":"Aggregate District",
                "districtGroups":{
                    "userGroups":[]
                },
                "districts":[],
                "districtsExpanded":
                    [
                        {
                            "name":"All Districts",
                            "value":"all"
                        }
                    ],
                "districtsSelectType":"all"
            },
            "importPrograms":{
                "aggregation":None,
                "importPrograms":[],
                "programsSelectType":"all"
            },
            "extImportPrograms":{
                "aggregation":"Aggregate CSC",
                "extImportPrograms":[],
                "extImportProgramsExpanded":[],
                "programsSelectType":"all"
            },
            "provisionCodes":{
                "aggregation":"Aggregate RPCODE",
                "provisionCodesSelectType":"all",
                "rateProvisionCodes":[],
                "rateProvisionCodesExpanded":[]
            }
        },
        "commodities":{
            "aggregation":"Aggregate Commodities",
            "codeDisplayFormat":"YES",
            "commodities":[],
            "commoditiesExpanded":[],
            "commoditiesManual":"",
            "commodityGroups":{
                "systemGroups":[],
                "userGroups":[]
            },
            "commoditySelectType":"all",
            "granularity":"2",
            "groupGranularity":None,
            "searchGranularity":None
        },
        "componentSettings":{
            "dataToReport":
                [
                    "CONS_FIR_UNIT_QUANT"
                ],
            "scale":"1",
            "timeframeSelectType":"fullYears",
            "years":
                [
                    "2022","2023"
                ],
            "startDate":None,
            "endDate":None,
            "startMonth":None,
            "endMonth":None,
            "yearsTimeline":"Annual"
        },
        "countries":{
            "aggregation":"Aggregate Countries",
            "countries":[],
            "countriesExpanded":
                [
                    {
                        "name":"All Countries",
                        "value":"all"
                    }
                ],
            "countriesSelectType":"all",
            "countryGroups":{
                "systemGroups":[],
                "userGroups":[]
            }
        }
    },
    "sortingAndDataFormat":{
        "DataSort":{
            "columnOrder":[],
            "fullColumnOrder":[],
            "sortOrder":[]
        },
        "reportCustomizations":{
            "exportCombineTables":False,
            "showAllSubtotal":True,
            "subtotalRecords":"",
            "totalRecords":"20000",
            "exportRawData":False
        }
    }
}

Appendix - API Query Parameter Generation using the DataWeb UI
If you are having trouble creating a customized query, this part of the document will help you get what you need. This guide will illustrate how to do this in Firefox. Other browsers will have similar functionality but may use slightly different language and may look slightly different than this, but the process will be almost identical.

Step 1. Build the query you are trying to send to the API using the Dataweb site. Right click anywhere on the screen and select "Inspect"

Note: In firefox this will open a tab at the bottom of the screen (as seen in the screenshots) and in Chrome and Edge it will Display on the side of the screen.

Step1.png

Step 2. The inspect tab will open and your original Dataweb screen will be split with this. Select the "Network" tab which should the fourth tab in the Developer tools window

image.png

Step 3. Run the Dataweb Query using "View Results" button

Step 4. Once you run the query, you will see a few items appear in the Network tab. You will select the item named "runReport"

Note: You should select the "RunReport" labelled "POST", which is the API request that you will be copying

image.png

Step 5. Clicking on "runReport" will reveal information about the API request that you can use to make your own query. If you select "Request" in Firefox or "Payload" in Chrome and Edge it will display the request payload used in the API request. This shows the variables used when querying the API, you can use elements from this request payload to edit you query.

You can directly copy the request payload and use that to get the same results hitting the API directly.

Note: you will need to use the json.loads() function in python to format this json object into something that python can use.

image.png

