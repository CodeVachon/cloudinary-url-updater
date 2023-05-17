# @codevachon/cloudinary-url-updater

CLI Tool to update the URL in the Database for Cloudinary Assets after they
have been migrated from one account to another

## .env file

```
DATABASE_URL=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_SCHEMA=

DESTINATION_CLOUDINARY_CLOUD_NAME=
DESTINATION_CLOUDINARY_KEY=
DESTINATION_CLOUDINARY_SECRET=
```

## MySQL Record Update

After Manually Migrating the Assets to the New Account, Run this script to change any database values.

```sql
UPDATE contentblockelements
SET value = (
    SELECT uri
    FROM assets
    WHERE publicId = SUBSTRING_INDEX(SUBSTRING_INDEX(value, '/', -2), '.', 1)
)
WHERE value LIKE '%cloudinary.com/<OLD_CLOUD_NAME>%'
;
```
