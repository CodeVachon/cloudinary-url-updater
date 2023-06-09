import * as dotenv from "dotenv";
dotenv.config();

import { v2 as cloudinary, ConfigOptions } from "cloudinary";
import { knex } from "knex";

const cloudinaryOptions: ConfigOptions = {
    cloud_name: String(process.env.DESTINATION_CLOUDINARY_CLOUD_NAME),
    api_key: String(process.env.DESTINATION_CLOUDINARY_KEY),
    api_secret: String(process.env.DESTINATION_CLOUDINARY_SECRET),
    secure: true
};

const db = knex({
    client: "mysql2",
    connection: {
        host: String(process.env.DATABASE_URL),
        port: Number(process.env.DATABASE_PORT),
        user: String(process.env.DATABASE_USER),
        password: String(process.env.DATABASE_PASSWORD),
        database: String(process.env.DATABASE_SCHEMA)
    }
});

async function init() {
    /**
     * Get all records from the assets table
     */
    const recordSet = await db
        .select<Array<{ id: string; uri: string; publicId: string }>>("id", "uri", "publicId")
        .from("assets")
        .limit(1500);

    /**
     * Configure Cloudinary
     */
    cloudinary.config(cloudinaryOptions);

    /**
     * For Each Record in the Record Set
     */
    const max = recordSet.length;
    for (let i = 0; i < max; i++) {
        const record = recordSet[i];
        console.log(`Processing Record ${i + 1} of ${max} - ${record.uri}`);

        /**
         * Get the extension from the URI
         */
        const ext = record.uri.trim().split(".").pop();

        /**
         * Manually upload the image to Cloudinary from Old Location
         */
        const uploaded = await cloudinary.uploader.upload(record.uri, {
            public_id: String(record.publicId),
            overwrite: true,
            resource_type: ext === "mp4" ? "video" : "image"
        });

        /**
         * Generate the new URI from the source image URL and the extension
         */
        const newURI = uploaded.secure_url;

        /**
         * Update the record in the database
         */
        await db
            .update({ uri: newURI, updated_at: new Date() })
            .from("assets")
            .where({ id: record.id });

        /**
         * Log the update
         */
        console.log("Update Record");
        console.log(`FROM: ${record.uri}`);
        console.log(`TO:   ${newURI}`);
        console.log("");
    } // close for each record in recordSet
} // close init

init()
    .then(() => console.log("Done"))
    .catch((error) => console.error(error))
    .finally(() => process.exit(0));
