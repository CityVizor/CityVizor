import express from 'express';
import acl from "express-dynacl";

import { db } from "../../db";
import { CodelistRecord } from '../../schema/database';

const router = express.Router();

export const CodelistsRouter = router;

router.get("/", async (req, res, next) => {
	const codelists = await db<CodelistRecord>("codelists").distinct("codelist").then(rows => rows.map(row => row.codelist));
	res.json(codelists);
});

router.get("/:name", async (req, res, next) => {

	let query: string = "SELECT id, name, description, validFrom, validTill FROM codelists WHERE name = %L";
	if (req.query.date) query += "AND (validFrom IS NULL OR validFROM <= %L) AND (validTill IS NULL OR validTill >= %L)";

	const codelist = await db<CodelistRecord>("codelists")
		.select("id", "name", "description", "validFrom", "validTill")
		.where({ codelist: req.params.name });

	if (codelist.length) res.json(codelist);
	else res.sendStatus(404);

});