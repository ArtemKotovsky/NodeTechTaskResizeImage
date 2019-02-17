from urllib.parse import urlencode
from urllib.request import Request, urlopen
import base64

def create():
    url = 'http://localhost:3000/image'
    post_fields = {
        'user_id': '1sd',
        #'image':  base64.b64encode(open('test.jpeg', 'rb').read()),
        'image_id': "a9a6c006cf18943fa06d68f6f8ff35dffbc49d4e3ee8c50d74ce50c5c01f678d",
        'height': 100,
        'width': 500
    }
    
    request = Request(url, urlencode(post_fields).encode())
    json = urlopen(request).read().decode()
    print(json)
  
def del_user():
    url = 'http://localhost:3000/image'
    post_fields = {
        'user_id': '1',
        'image_id': "a9a6c006cf18943fa06d68f6f8ff35dffbc49d4e3ee8c50d74ce50c5c01f678d",
        #'subimage_id': "a9a6c006cf18943fa06d68f6f8ff35dffbc49d4e3ee8c50d74ce50c5c01f678d"
    }
    
    request = Request(url, urlencode(post_fields).encode())
    request.get_method = lambda: 'DELETE'
    json = urlopen(request).read().decode()
    print(json)
    
def get_user():
    url = 'http://localhost:3000/image/1sd/a9a6c006cf18943fa06d68f6f8ff35dffbc49d4e3ee8c50d74ce50c5c01f678d/'
    request = Request(url)
    json = urlopen(request).read().decode()
    print(json)
    
create()
get_user()