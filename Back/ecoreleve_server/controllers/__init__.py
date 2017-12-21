"""
Created on Mon Aug 25 13:18:12 2014

@author: Natural Solutions (Thomas)
"""
from sqlalchemy import (Column,
                        ForeignKey,
                        String,
                        Integer,
                        Float,
                        DateTime,
                        select,
                        join,
                        func,
                        not_,
                        exists,
                        event,
                        Table,
                        Index,
                        UniqueConstraint,
                        Table,
                        text,
                        bindparam,
                        insert,
                        desc)
import types


# ****************** TEST ****************************


# import json
# import os
# with open(os.path.dirname(__file__) + '/../db_config.json') as data_file:
#     storageConf = json.load(data_file)

# from .OrmController import OrmFactory
# from sqlalchemy import exc as sa_exc
# import warnings
# from functools import wraps
# with warnings.catch_warnings():
#     warnings.simplefilter("ignore", category=sa_exc.SAWarning)
#     ModelFactory = OrmFactory(storageConf['db_objects'])


# def patch(myClass, methodType=None):
#     methodTypeDict = {'classmethod': classmethod,
#                       'staticmethod': staticmethod}
#     wrappingMethod = methodTypeDict.get(methodType, None)

#     def real_decorator(function):
#         if not wrappingMethod:
#             setattr(myClass, function.__name__,
#                     types.MethodType(function, myClass))
#         else:
#             setattr(myClass, function.__name__, wrappingMethod(function))
#     return real_decorator


# Alleluhia = ModelFactory.Alleluhia
# # print(Alleluhia)


# @patch(Alleluhia)
# def toto(self, hop):
#     print('toto', self.__dict__, hop)
#     return hop + ' __ ajouter !!!! '
# print(r)
