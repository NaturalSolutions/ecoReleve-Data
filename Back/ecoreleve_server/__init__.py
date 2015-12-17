import datetime
from decimal import Decimal
import transaction
from urllib.parse import quote_plus

from sqlalchemy import engine_from_config

from pyramid.config import Configurator
from pyramid.request import Request, Response
from pyramid.renderers import JSON
from pyramid.authentication import AuthTktAuthenticationPolicy
from pyramid.authorization import ACLAuthorizationPolicy

from .controllers.security import SecurityRoot, role_loader
from .renderers.csvrenderer import CSVRenderer
from .renderers.pdfrenderer import PDFrenderer
from .renderers.gpxrenderer import GPXRenderer
from .Models import (
    Base,
    dbConfig,
    Station,
    Observation,
    Sensor,
    db
    )
from .Views import add_routes

from .pyramid_jwtauth import (
    JWTAuthenticationPolicy,
    includeme
    )
from pyramid.events import NewRequest
from sqlalchemy.orm import sessionmaker,scoped_session

def datetime_adapter(obj, request):
    """Json adapter for datetime objects."""
    try: 
        return obj.strftime ('%d/%m/%Y %H:%M:%S')
    except :
        return obj.strftime ('%d/%m/%Y')

def time_adapter(obj, request):
    """Json adapter for datetime objects."""
    try:
        return obj.strftime('%H:%M')
    except:
        return obj.strftime('%H:%M:%S')
    
def decimal_adapter(obj, request):
    """Json adapter for Decimal objects."""
    return float(obj)

def main(global_config, **settings):
    """ This function initialze DB conection and returns a Pyramid WSGI application. """
    settings['sqlalchemy.url'] = settings['cn.dialect'] + quote_plus(settings['sqlalchemy.url'])
    engine = engine_from_config(settings, 'sqlalchemy.', legacy_schema_aliasing=True)
    dbConfig['url'] = settings['sqlalchemy.url']
    dbConfig['wsThesaurus'] = {}
    dbConfig['wsThesaurus']['wsUrl'] = settings['wsThesaurus.wsUrl']
    dbConfig['wsThesaurus']['lng'] = settings['wsThesaurus.lng']
    dbConfig['data_schema'] = settings['data_schema']

    Base.metadata.bind = engine
    Base.metadata.create_all(engine)
    Base.metadata.reflect(views=True, extend_existing=False)

    config = Configurator(settings=settings)
    config.include('pyramid_tm')

    config.registry.dbmaker = scoped_session(sessionmaker(bind=engine))
    config.add_request_method(db, name='dbsession', reify=True)

    # DBSession.configure(bind=engine)
    # config.add_request_method(callable=lambda request:DBSession(),name='dbsession',property=True )
    # config.add_subscriber(setup_post_request,NewRequest)

    # Add renderer for JSON objects
    json_renderer = JSON()
    json_renderer.add_adapter(datetime.datetime, datetime_adapter)
    json_renderer.add_adapter(datetime.date, datetime_adapter)
    json_renderer.add_adapter(Decimal, decimal_adapter)
    json_renderer.add_adapter(datetime.time, time_adapter)
    config.add_renderer('json', json_renderer)

    # Add renderer for CSV, PDF,GPX files.
    config.add_renderer('csv', CSVRenderer)
    config.add_renderer('pdf', PDFrenderer)
    config.add_renderer('gpx', GPXRenderer)

    includeme(config)
    config.set_root_factory(SecurityRoot)

    # Set the default permission level to 'read'
    config.set_default_permission('read')
    add_routes(config)
    config.scan()
    return config.make_wsgi_app()
