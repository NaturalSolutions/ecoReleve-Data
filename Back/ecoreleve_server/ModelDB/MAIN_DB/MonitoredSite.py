from datetime import datetime
import copy
from sqlalchemy import (
    and_,
    Boolean,
    Column,
    DateTime,
    desc,
    Integer,
    String,
    Sequence,
    select,
    func
    )
from sqlalchemy.orm import relationship
from ecoreleve_server.core.base_model import HasDynamicProperties
from ecoreleve_server.ModelDB import MAIN_DB
from .MonitoredSitePosition import MonitoredSitePosition
from ecoreleve_server.utils.datetime import parse
from ecoreleve_server.utils.parseValue import isEqual, parser


class MonitoredSite (HasDynamicProperties, MAIN_DB):

    __tablename__ = 'MonitoredSite'
    moduleFormName = 'MonitoredSiteForm'
    moduleGridName = 'MonitoredSiteGrid'

    ID = Column(Integer, Sequence('MonitoredSite__id_seq'), primary_key=True)
    Name = Column(String(250), nullable=False)
    Category = Column(String(250), nullable=False)
    Creator = Column(Integer, nullable=False)
    Active = Column(Boolean, nullable=False, default=1)
    creationDate = Column(DateTime, nullable=False, default=func.now())
    Place = Column(String(250))

    MonitoredSitePositions = relationship(
        'MonitoredSitePosition',
        backref='MonitoredSite',
        cascade="all,delete-orphan")
    Stations = relationship('Station')
    Equipments = relationship('Equipment')

    def GetLastPositionWithDate(self, date_):
        query = select([MonitoredSitePosition]
                       ).where(
            and_(MonitoredSitePosition.FK_MonitoredSite == self.ID,
                 MonitoredSitePosition.StartDate <= date_)
        ).order_by(desc(MonitoredSitePosition.StartDate)
                   ).limit(1)
        curPos = self.session.execute(query).fetchone()
        if curPos is not None:
            return dict(curPos)
        else:
            return []
        # return curPos

    def getValues(self):
        values = HasDynamicProperties.getValues(self)
        lastPos = self.GetLastPositionWithDate(func.now())
        if lastPos is not None:
            for key in lastPos:
                if key != 'ID':
                    values[key] = lastPos[key]
        self.__values__.update(values)
        return values

    def setValue(self, propertyName, value, useDate=None):
        super().setValue(propertyName, value)
        if hasattr(self.newPosition, propertyName):
            curTypeAttr = str(self.newPosition.__table__.c[
                              propertyName].type).split('(')[0]

            if 'date'.lower() in curTypeAttr.lower():
                value = parse(str(value).replace(' ', ''))
                setattr(self.newPosition, propertyName, value)
            else:
                setattr(self.newPosition, propertyName, value)
            if ((propertyName not in self.values) or
               (isEqual(self.values[propertyName], value) is False)):
                self.positionChanged = True

    @HasDynamicProperties.values.setter
    def values(self, dict_):
        myDict = copy.deepcopy(dict_)

        '''parameters:
            - data (dict)
        set object properties (static and dynamic),
        it's possible to set all dynamic properties
        with date string with __useDate__ key'''
        self.newPosition = MonitoredSitePosition()
        self.positionChanged = False
        self.previousState = self.values
        if myDict.get('ID', None):
            del myDict['ID']
        if (self.fk_table_type_name not in myDict and
           'type_id' not in myDict and not self.type_id):
            raise Exception('object type not exists')
        else:
            type_id = myDict.get(self.fk_table_type_name, None) or myDict.get(
                'type_id', None)
            if self.type_id:
                type_id = self.type_id
            self._type = self.session.query(self.TypeClass).get(type_id)
            useDate = parser(myDict.get('__useDate__', None)
                             ) or self.linkedFieldDate()
            for prop, value in myDict.items():
                self.setValue(prop, value, useDate)

            self.setPosition(myDict)
            self.updateLinkedField(myDict, useDate=useDate)

    def setPosition(self, DTOObject):
        if self.positionChanged:
            sameDatePosition = list(filter(
                lambda x:
                x.StartDate == datetime.strptime(
                                                DTOObject['StartDate'],
                                                '%Y-%m-%dT%H:%M:%S.%fZ'),
                self.MonitoredSitePositions))
            if len(sameDatePosition) > 0:
                sameDatePosition[0].LAT = DTOObject['LAT']
                sameDatePosition[0].LON = DTOObject['LON']
                sameDatePosition[0].ELE = DTOObject['ELE']
                sameDatePosition[0].Precision = DTOObject['Precision']
                sameDatePosition[0].Comments = DTOObject['Comments']
            else:
                self.MonitoredSitePositions.append(self.newPosition)
