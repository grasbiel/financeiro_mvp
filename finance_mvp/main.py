import psycopg2
from dotenv import load_dotenv
import os

load_dotenv()

USER= os.getenv("user")
PASSWORD = os.getenv("password")
HOST= os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

try:
    connection= psycopg2.connect(
        user = USER,
        password= PASSWORD,
        host= HOST,
        port = PORT,
        dbname= DBNAME
    )
    print("Connection Successfull")

    cursor = connection.cursor()

    cursor.execute("SELECT NOW();")
    result = cursor.fetchone()
    print("Current Time: ", result)

    cursor.close()
    connection.close()
    print("Connection Closed")

except Exception as e:
    print(f"Failed to connect: {e}")
