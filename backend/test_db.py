
from backend.database import get_connection

try:
    connection = get_connection()

    print("PostgreSQL connection successful!")

    connection.close()

except Exception as error:
    print("Connection failed:", error)
