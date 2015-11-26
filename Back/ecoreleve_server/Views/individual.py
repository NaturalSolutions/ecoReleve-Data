from pyramid.view import view_config
from ..Models import (
    DBSession,
    Individual,
    IndividualType,
    IndividualDynPropValue,
    IndividualDynProp,
    Individual_Location,
    Sensor,
    SensorType,
    Equipment,
    IndividualList,
    Base

    )
from ..GenericObjets.FrontModules import FrontModules
from ..GenericObjets import ListObjectWithDynProp
import transaction
import json, itertools
from datetime import datetime
import datetime as dt
import pandas as pd
import numpy as np
from sqlalchemy import select, and_,cast, DATE,func,desc,join,asc
from sqlalchemy.orm import aliased
from pyramid.security import NO_PERMISSION_REQUIRED
from traceback import print_exc
from collections import OrderedDict
from ..utils.distance import haversine



prefix = 'individuals'

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
@view_config(route_name= prefix+'/id/history/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
@view_config(route_name= prefix+'/id/equipment/action', renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def actionOnIndividuals(request):
    print ('\n*********************** Action **********************\n')
    dictActionFunc = {
    'count' : count_,
    'forms' : getForms,
    '0' : getForms,
    'getFields': getFields,
    'getFilters': getFilters,
    'getType': getIndividualType
    }
    actionName = request.matchdict['action']
    return dictActionFunc[actionName](request)

def count_ (request = None,listObj = None) :
    print('*****************  INDIVIDUAL COUNT***********************')
    ModuleType = 'IndivFilter'
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    if request is not None : 
        data = request.params
        if 'criteria' in data: 
            data['criteria'] = json.loads(data['criteria'])
            if data['criteria'] != {} :
                searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]
        else : 
            searchInfo = {'criteria':None}
        
        listObj = ListObjectWithDynProp(Individual,moduleFront)
        count = listObj.count(searchInfo = searchInfo)
    else : 
        count = listObj.count()

    print(count)
    return count 

def getFilters (request):
    ModuleType = 'IndivFilter'
    filtersList = Individual().GetFilters(ModuleType)
    filters = {}
    for i in range(len(filtersList)) :
        filters[str(i)] = filtersList[i]
    transaction.commit()
    return filters

def getForms(request) :
    typeIndiv = request.params['ObjectType']
    print('***************** GET FORMS ***********************')
    ModuleName = 'IndivForm'
    Conf = DBSession.query(FrontModules).filter(FrontModules.Name==ModuleName ).first()
    newIndiv = Individual(FK_IndividualType = typeIndiv)
    newIndiv.init_on_load()
    schema = newIndiv.GetDTOWithSchema(Conf,'edit')
    transaction.commit()
    return schema

def getFields(request) :
    ModuleType = request.params['name']
    if ModuleType == 'default' :
        ModuleType = 'IndivFilter'
    cols = Individual().GetGridFields(ModuleType)
    transaction.commit()
    return cols

def getIndividualType(request):
    query = select([IndividualType.ID.label('val'), IndividualType.Name.label('label')])
    response = [ OrderedDict(row) for row in DBSession.execute(query).fetchall()]
    return response


# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/autocomplete', renderer='json', request_method = 'GET',permission = NO_PERMISSION_REQUIRED )
def autocomplete (request):
    criteria = request.params['term']
    prop = request.matchdict['prop']

    table = Base.metadata.tables['IndividualDynPropValuesNow']
    query = select([table.c['ValueString'].label('label'),table.c['ValueString'].label('value')]
        ).where(table.c['FK_IndividualDynProp']== prop)
    query = query.where(table.c['ValueString'].like('%'+criteria+'%')).order_by(asc(table.c['ValueString']))

    return [dict(row) for row in DBSession.execute(query).fetchall()]


# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'GET')
def getIndiv(request):
    print('***************** GET INDIVIDUAL ***********************')
    id = request.matchdict['id']
    curIndiv = DBSession.query(Individual).get(id)
    curIndiv.LoadNowValues()

    # if Form value exists in request --> return data with schema else return only data
    if 'FormName' in request.params :
        ModuleName = request.params['FormName']
        try :
            DisplayMode = request.params['DisplayMode']
        except : 
            DisplayMode = 'display'
        
        Conf = DBSession.query(FrontModules).filter(FrontModules.Name=='IndivForm').first()
        response = curIndiv.GetDTOWithSchema(Conf,DisplayMode)

    if 'geo' in request.params :
        geoJson=[]
        joinTable = join(Individual_Location, Sensor, Individual_Location.FK_Sensor == Sensor.ID)
        stmt = select([Individual_Location,Sensor.UnicIdentifier]).select_from(joinTable
            ).where(Individual_Location.FK_Individual == id)
        dataResult = DBSession.execute(stmt).fetchall()

        for row in dataResult:
            geoJson.append({'type':'Feature', 'properties':{'type':row['type_']
                , 'sensor':row['UnicIdentifier'],'date':row['Date']}
                , 'geometry':{'type':'Point', 'coordinates':[row['LAT'],row['LON']]}})
        result = {'type':'FeatureCollection', 'features':geoJson}
        response = result

    # if 'geoDynamic' in request.params :
    #     geoJson=[]
    #     joinTable = join(Individual_Location, Sensor, Individual_Location.FK_Sensor == Sensor.ID)
    #     stmt = select([Individual_Location,Sensor.UnicIdentifier]).select_from(joinTable
    #         ).where(Individual_Location.FK_Individual == id
    #         ).where(Individual_Location.type_ == 'GSM').order_by(asc(Individual_Location.Date))
    #     dataResult = DBSession.execute(stmt).fetchall()
        
    #     df = pd.DataFrame.from_records(dataResult, columns=dataResult[0].keys(), coerce_float=True)
    #     X1 = df.iloc[:-1][['LAT', 'LON']].values
    #     X2 = df.iloc[1:][['LAT', 'LON']].values
    #     df['dist'] = np.append(haversine(X1, X2), 0).round(3)
    #     # Compute the speed
    #     df['speed'] = (df['dist'] / ((df['Date'] - df['Date'].shift(-1)).fillna(1) / np.timedelta64(1, 'h'))).round(3)
    #     df['Date'] = df['Date'].apply(lambda row: np.datetime64(row).astype(datetime)) 

    #     for i in range(df.shape[0]):
    #         geoJson.append({'type':'Feature', 'properties':{'type':df.loc[i,'type_']
    #             , 'sensor':df.loc[i,'UnicIdentifier'],'speed':df.loc[i,'speed'],'date':df.loc[i,'Date']}
    #             , 'geometry':{'type':'Point', 'coordinates':[df.loc[i,'LAT'],df.loc[i,'LON']]}})
    #     result = {'type':'FeatureCollection', 'features':geoJson}
    #     response = result
    # else : 
    #     response  = curIndiv.GetFlatObject()

    transaction.commit()
    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/history', renderer='json', request_method = 'GET')
def getIndivHistory(request):

    #128145
    id = request.matchdict['id']
    tableJoin = join(IndividualDynPropValue,IndividualDynProp
        ,IndividualDynPropValue.FK_IndividualDynProp == IndividualDynProp.ID)
    query = select([IndividualDynPropValue,IndividualDynProp.Name]).select_from(tableJoin).where(
        IndividualDynPropValue.FK_Individual == id
        ).order_by(desc(IndividualDynPropValue.StartDate))
    result = DBSession.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        dictRow = {}
        for key in curRow :
            if curRow[key] is not None :
                if 'Value' in key :
                    dictRow['value'] = curRow[key] 
                elif 'FK' not in key :
                    dictRow[key] = curRow[key]
        response.append(dictRow)

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id/equipment', renderer='json', request_method = 'GET')
def getIndivEquipment(request):

    id_indiv = request.matchdict['id']
    joinTable = join(Equipment,Sensor, Equipment.FK_Sensor == Sensor.ID
        ).join(SensorType,Sensor.FK_SensorType == SensorType.ID)
    query = select([Equipment.StartDate,SensorType.Name.label('Type'),Sensor.UnicIdentifier,Equipment.Deploy]).select_from(joinTable
        ).where(Equipment.FK_Individual == id_indiv).order_by(desc(Equipment.StartDate))
    result = DBSession.execute(query).fetchall()
    response = []
    for row in result:
        curRow = OrderedDict(row)
        if curRow['Deploy'] == 1 : 
            curRow['Deploy'] = 'Deploy'
        else : 
            curRow['Deploy'] = 'Remove'
        response.append(curRow)

    return response

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'DELETE',permission = NO_PERMISSION_REQUIRED)
def deleteIndiv(request):
    id_ = request.matchdict['id']
    curIndiv = DBSession.query(Individual).get(id_)
    DBSession.delete(curIndiv)
    transaction.commit()
    return True

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix+'/id', renderer='json', request_method = 'PUT')
def updateIndiv(request):
    print('*********************** UPDATE Individual *****************')
    data = request.json_body
    id = request.matchdict['id']
    curIndiv = DBSession.query(Individual).get(id)
    curIndiv.LoadNowValues()
    curIndiv.UpdateFromJson(data)
    transaction.commit()
    return {}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix  + '/insert', renderer='json', request_method = 'POST')
def insertIndiv(request):
    data = request.json_body
    if not isinstance(data,list):
        print('_______INsert ROW *******')
        return insertOneNewIndiv(request)
    else :
        print('_______INsert LIST')
        #transaction.commit()
        #return insertListNewIndivs(request)

# ------------------------------------------------------------------------------------------------------------------------- #
def insertOneNewIndiv (request) :
    data = {}
    for items , value in request.json_body.items() :
        if value != "" :
            data[items] = value

    #newIndiv = Individual(FK_IndividualType = data['FK_IndividualType'], creator = request.authenticated_userid)
    indivType = int(data['FK_IndividualType'])
    print(data)
    newIndiv = Individual(FK_IndividualType = indivType , creationDate = datetime.now(),Original_ID = '0')
    newIndiv.IndividualType = DBSession.query(IndividualType).filter(IndividualType.ID==indivType).first()
    newIndiv.init_on_load()
    newIndiv.UpdateFromJson(data)
    print (newIndiv.__dict__)
    DBSession.add(newIndiv)
    DBSession.flush()
    # transaction.commit()
    return {'ID': newIndiv.ID}

# ------------------------------------------------------------------------------------------------------------------------- #
@view_config(route_name= prefix, renderer='json', request_method = 'GET', permission = NO_PERMISSION_REQUIRED)
def searchIndiv(request):
    data = request.params.mixed()
    print('*********data*************')
    print(data)
    searchInfo = {}
    searchInfo['criteria'] = []
    if 'criteria' in data: 
        data['criteria'] = json.loads(data['criteria'])
        if data['criteria'] != {} :
            searchInfo['criteria'] = [obj for obj in data['criteria'] if obj['Value'] != str(-1) ]

    searchInfo['order_by'] = json.loads(data['order_by'])
    searchInfo['offset'] = json.loads(data['offset'])
    searchInfo['per_page'] = json.loads(data['per_page'])

    ModuleType = 'IndivFilter'
    moduleFront  = DBSession.query(FrontModules).filter(FrontModules.Name == ModuleType).one()
    print('**criteria********' )
    print(searchInfo['criteria'])
    start = datetime.now()
    listObj = IndividualList(moduleFront)
    dataResult = listObj.GetFlatDataList(searchInfo)

    stop = datetime.now()
    print ('______ TIME to get DATA : ')
    print (stop-start)
    start = datetime.now()
    countResult = listObj.count(searchInfo)
    print ('______ TIME to get Count : ')
    stop = datetime.now()
    print (stop-start)

    result = [{'total_entries':countResult}]
    result.append(dataResult)
    transaction.commit()
    return result


def getIndivEquipmentAtDate(request):

    data = request.json_body










