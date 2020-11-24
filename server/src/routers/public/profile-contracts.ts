import express from 'express';
import acl from "express-dynacl";

import { db, sort2order } from "../../db";
import { ContractRecord } from '../../schema/database';

const router = express.Router({ mergeParams: true });

export const ProfileContractsRouter = router;

router.get("/", async (req, res) => {

	const contracts = await db<ContractRecord>("contracts")
		.where({ profile_id: req.params.profile })
		.limit(req.query.limit ? Math.min(Number(req.query.limit), 100) : req.query.limit)
		.offset(req.query.offset || 0)
		.modify(function(){
			if(req.query.sort) this.orderBy(sort2order(req.query.sort));
		});

	res.json(contracts);

});