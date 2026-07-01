from core.settings import settings
import socket
print('Loaded DATABASE_URL:', settings.database_url)
host = settings.database_url.split('@')[-1].split(':')[0]
print('Host parsed:', host)
try:
    infos = socket.getaddrinfo(host, None)
    print('getaddrinfo returned:')
    for info in infos:
        print(' ', info[4])
except Exception as e:
    print('getaddrinfo error:', e)
