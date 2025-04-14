# Hospital appointmant booking app

# Description: This is a simple hospital appointment booking app. It allows users to book appointments with doctors
# and view their appointment history.

POST    http://localhost:9000/signup?type=json      public

POST    http://localhost:9000/login?type=json       public

GET     http://localhost:9000/get-available-dates?type=json        public   

GET     http://localhost:9000/available-slots/:id?type=json            public
         
POST    http://localhost:9000/add-slot?type=json 
POST    http://localhost:9000/delete-slot?type=json 

POST    http://localhost:9000/book-appointment?type=json

GET     http://localhost:9000/all-bookings/:id?type=json 
GET     http://localhost:9000/get-booking/:mobileNo?type=json       public

POST    http://localhost:9000/cancel-booking/:mobileNo?type=json 

POST    http://localhost:9000/reschedule-appointment/:mobileNo?type=json

POST    http://localhost:9000/logout?type=json      public

## when test in postman

    Add ?type=json in API for JSON data (POSTMAN)