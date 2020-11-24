import express from 'express';

import path from "path";
import multer from 'multer';
import acl from "express-dynacl";
import schema from 'express-jsonschema';

import extract from "extract-zip";
import fs from "fs-extra";

import config from "../../config";

import { db } from '../../db';
import { YearRecord, ProfileRecord } from '../../schema';
import { ImportRecord } from '../../schema/database/import';
import { ensureDir, move } from 'fs-extra';
import { DateTime } from 'luxon';

const router = express.Router();

export const ImportAccountingRouter = router;

const importAccountingSchema = {
	body: {
		type: "object",
		properties: {
			"year": { type: "string" },
			"validity": { type: "string", format: "date" }
		},
		required: ["year"],
		additionalProperties: false
	}
};  

const upload = multer({ dest: config.storage.tmp });

router.post("/profiles/:profile/accounting",
	upload.fields([{ name: "dataFile", maxCount: 1 }, { name: "zipFile", maxCount: 1 }, { name: "eventsFile", maxCount: 1 }, { name: "paymentsFile", maxCount: 1 }]),
	schema.validate(importAccountingSchema),
	acl("profile-accounting", "write"),
	async (req, res, next) => {

		// When file missing throw error immediately
		if (!req.files || (!req.files["dataFile"] && !req.files["zipFile"])) return res.status(400).send("Missing data file or zip file");
		if (isNaN(req.body.year)) return res.status(400).send("Invalid year value");

    // check if tokenCode in profile is same as in token. if not, the token has been revoked (revoke all current tokens by changing the code)
		const profile = await db<ProfileRecord>("app.profiles").select("id", "tokenCode").where({ id: req.params.profile }).first();

		if (req.user.tokenCode && req.user.tokenCode !== profile.tokenCode) return res.status(403).send("Token revoked.");

    // check if imported year is created, if not create a new hidden year
		var year: { profileId: number, year: number } = await db<YearRecord>("app.years")
			.where({ profileId: req.params.profile, year: req.body.year })
			.first();

		if (!year) {
			const yearInsert = await db<YearRecord>("app.years").insert({ profileId: Number(req.params.profile), year: req.body.year }, ["profileId", "year"]).then()
			year = yearInsert ? yearInsert[0] : null;
			if (!year) return res.status(500).send("Failed to create new accounting year in database.");
		}

    // add import task to database queue (worker checks the table)
		var importData: Partial<ImportRecord> = {
			profileId: year.profileId,
			year: year.year,

			userId: req.user ? req.user.id : undefined,

			created: DateTime.local().toJSDate(),

			status: "pending",
			error: null,

			validity: req.body.validity || undefined,
		};

		const result = await db<ImportRecord>("app.imports").insert(importData, ["id"]);
		const importId = result ? result[0].id : null;

		if (!importId) return res.status(500).send("Failed to create import record in database.");


    // if task created move the uploaded data and possibly unzip them if zip provided
		const importDir = path.join(config.storage.imports, "import_" + importId);

		await ensureDir(importDir);

		if (req.files["zipFile"] && req.files["zipFile"][0]) {
			extractZip(req.files["zipFile"][0].path, importDir);
		}
		else {
			if (req.files["dataFile"] && req.files["dataFile"][0]) await move(req.files["dataFile"][0].path, path.join(importDir, "data.csv"));
			if (req.files["eventsFile"] && req.files["eventsFile"][0]) await move(req.files["eventsFile"][0].path, path.join(importDir, "events.csv"));
			if (req.files["paymentsFile"] && req.files["paymentsFile"][0]) await move(req.files["paymentsFile"][0].path, path.join(importDir, "payments.csv"));
		}

    // get the current full task info (including default values etc.) and return it to the client
		const importDataFull = await db<ImportRecord>("app.imports").where({ id: importId }).first();

		res.json(importDataFull);
	}
);

async function extractZip(zipFile: string, unzipDir: string) {

	try {
		await new Promise((resolve, reject) => {
			extract(zipFile, { dir: unzipDir }, err => err ? reject(err) : resolve());
		});
	}
	catch (e) {
		throw new Error("Unable to extract ZIP file: " + e.message);
	}

	const extractedFiles = await fs.readdir(unzipDir);

	return {
		dataFile: extractedFiles.filter(file => file.match(/data/i))[0],
		eventsFile: extractedFiles.filter(file => file.match(/events/i))[0],
		paymentsFile: extractedFiles.filter(file => file.match(/payments/i))[0]
	};

}