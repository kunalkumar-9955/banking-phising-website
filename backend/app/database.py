from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]

    # Create indexes
    await db.users.create_index("email", unique=True)
    await db.scans.create_index("user_id")
    await db.scans.create_index("created_at")
    await db.blocked_domains.create_index("domain", unique=True)
    await db.reports.create_index("user_id")

    print(f"✅ Connected to MongoDB: {settings.DATABASE_NAME}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("❌ MongoDB connection closed")


def get_database():
    return db
