from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Sequence,
    func
    )
from sqlalchemy.orm import relationship
from ecoreleve_server.ModelDB import MAIN_DB
# from ecoreleve_server.core.base_model import HasDynamicProperties
from sqlalchemy.ext.hybrid import hybrid_property
from .Station_FieldWorker import Station_FieldWorker


class Station(MAIN_DB):

    __tablename__ = 'Station'

    moduleFormName = 'StationForm'
    moduleGridName = 'StationGrid'

    ID = Column(Integer, Sequence('Stations__id_seq'), primary_key=True)
    StationDate = Column(DateTime, index=True, nullable=False)
    Name = Column(String(250))
    LAT = Column(Numeric(9, 5))
    LON = Column(Numeric(9, 5))
    ELE = Column(Integer)
    precision = Column(Integer)
    fieldActivityId = Column(Integer, ForeignKey(
        'fieldActivity.ID'), nullable=True)
    creator = Column(Integer)
    creationDate = Column(DateTime, default=func.now())
    original_id = Column(String(250))
    Comments = Column(String(250))
    Place = Column(String(250))
    FK_MonitoredSite = Column(Integer, ForeignKey(
        'MonitoredSite.ID'), nullable=True)
    Comments = Column(String(250))
    FK_Region = Column(Integer, ForeignKey('Region.ID'), nullable=True)

    Observations = relationship(
        'Observation', back_populates='Station', cascade="all, delete-orphan")
    # FK_Region = Column(Integer, ForeignKey('Region.ID'), nullable=True)
    FK_FieldworkArea = Column(Integer, ForeignKey('FieldworkArea.ID'),
                              nullable=True)

    Station_FieldWorkers = relationship(
        'Station_FieldWorker', backref='Station', cascade="all, delete-orphan")

    MediasFiles = relationship(
        'MediasFiles', back_populates='Station', cascade="all, delete-orphan")

    ''' hybrid property on relationship '''
    @hybrid_property
    def FieldWorkers(self):
        if self.Station_FieldWorkers:
            fws = []
            for curFW in self.Station_FieldWorkers:
                fws.append(
                    {'FieldWorker': curFW.FK_FieldWorker, 'ID': curFW.ID})
            return fws
        else:
            return []

    ''' Configure a setter for this hybrid property '''
    @FieldWorkers.setter
    def FieldWorkers(self, values):
        fws = []
        if len(values) != 0:
            for item in values:
                if 'ID' in item and item['ID']:

                    curFW = list(filter(lambda x: x.ID == item[
                                 'ID'], self.Station_FieldWorkers))[0]
                    curFW.FK_FieldWorker = int(item['FieldWorker'])
                else:
                    curFW = Station_FieldWorker(FK_FieldWorker=int(
                        item['FieldWorker']), FK_Station=self.ID)
                fws.append(curFW)
        self.Station_FieldWorkers = fws

    @FieldWorkers.expression
    def FieldWorkers(self):
        return Station_FieldWorker.id
