def add_cors_headers_response_callback(event):
    def cors_headers(request, response):
        response.headers.update({
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST,GET,DELETE,PUT,OPTIONS',
            'Access-Control-Allow-Headers': 'Origin,\
                                            Content-Type,\
                                            Accept,\
                                            Authorization',
            'Access-Control-Allow-Credentials': 'true',
            'Access-Control-Max-Age': '1728000',
        })
    event.request.add_response_callback(cors_headers)


def cache_callback(request, session):
    if isinstance(request.exception, TimeoutError):
        session.get_bind().dispose()


def session_callback(request):
    makerDefault = request.registry.dbmaker
    session = makerDefault()

    def cleanup(request):
        if request.exception is not None:
            session.rollback()
            cache_callback(request, session)
            session.close()
            makerDefault.remove()
        else:
            try:
                session.commit()
            except BusinessRuleError as e:
                session.rollback()
                request.response.status_code = 409
                request.response.text = e.value
            except Exception as e:
                print_exc()
                session.rollback()
                request.response.status_code = 500
            finally:
                session.close()
                makerDefault.remove()

    request.add_finished_callback(cleanup)
    return session