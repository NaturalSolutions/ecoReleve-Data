import os
import sys
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
with open(os.path.join(here, 'README.txt')) as f:
    README = f.read()
with open(os.path.join(here, 'CHANGES.txt')) as f:
    CHANGES = f.read()

requires = [
    'jwcrypto==0.6.0',
    'exifread==2.1.2',
    'geojson==2.4.1',
    'lxml==4.3.3',
    'matplotlib==3.0.3',
    # 'opencv-python',
    'openpyxl==2.4.8',
    'pandas==0.24.2',
    'psutil==5.6.2',
    # 'pyexiftool==0.2.0',
    'pyodbc==4.0.26',
    # 'pypiwin32==223',
    'pyramid==1.10.4',
    'pyramid_jwtauth==0.1.3',
    'pyramid_tm==2.2.1',
    'pytesseract==0.2.0',
    'reportlab==3.4.0',
    'scipy==1.2.1',
    # 'shapely',
    'SQLAlchemy==1.3.3',
    'SQLAlchemy-Utils==0.33.1',
    'waitress==1.4.3'
    ]

dependency_links=[
    # ".\windows_packages\opencv_python-3.4.6-cp37-cp37m-win_amd64.whl",
    # "git+https://github.com/smarnach/pyexiftool.git#egg=pyexiftoll-0.2",
    # ".\windows_packages\Shapely-1.6.4.post1-cp37-cp37m-win_amd64.whl"    
    ]

setup(name='ecoreleve_server',
      version='1.0',
      description='ecoReleve_Server',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pyramid",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web wsgi bfg pylons pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='ecoreleve_server',
      install_requires=requires,
      dependency_links = dependency_links,
      entry_points="""\
      [paste.app_factory]
      main = ecoreleve_server:main
      [console_scripts]
      initialize_ecoReleve_Server_db = ecoreleve_server.scripts.initializedb:main
      """,
      )
