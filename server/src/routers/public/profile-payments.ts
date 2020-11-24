import express from 'express';
import acl from "express-dynacl";

import { db, sort2order } from "../../db";
import { PaymentRecord, EventRecord } from "../../schema/database";

const router = express.Router({ mergeParams: true });

export const ProfilePaymentsRouter = router;

router.get("/", async (req, res, next) => {

	const payments = await db<PaymentRecord>("payments")
		.where({ profile_id: req.params.profile })
		.limit(req.query.limit ? Math.min(Number(req.query.limit), 10000) : 10000)
		.offset(req.query.offset || 0)
		.modify(function () {			
			if (req.query.sort){
				const order = sort2order(req.query.sort);
				if(order.some(orderItem => orderItem.column === "date")) this.whereRaw("date IS NOT NULL"); // otherwise null payments would get selected on descending date
				this.orderBy(order);
			}
			if (req.query.event) this.where({ event: req.query.event });
			if (req.query.dateFrom) this.where("date", ">=", req.query.dateFrom);
			if (req.query.dateTo) this.where("date", "<", req.query.dateTo);
		})

	res.json(payments);
});

router.get("/months", async (req, res, next) => {

	const months = await db("payments")
		.select(db.raw("DISTINCT date_part('month', date) AS month, date_part('year', date) AS year"))
		.where({ profile_id: req.params.profile });

	res.json(months);

});

router.get("/:year/csv", async (req, res, next) => {

	const payments = await db<PaymentRecord>("payments").where({ profile_id: req.params.profile, year: req.params.year });
	const events = await db<EventRecord>("events").where({ profile_id: req.params.profile, year: req.params.year });

	const eventIndex = events.reduce((acc, cur) => { acc[String(cur.id)] = cur.name; return acc }, {});

	res.statusCode = 200;
	res.setHeader("Content-disposition", "attachment; filename=" + req.params.profile + "-" + req.params.year + ".payments.csv");
	res.setHeader('Content-Type', 'text/csv');

	var header = ['profileId', 'year', 'paragraph', 'item', 'unit', 'event', 'eventName', 'date', 'amount', 'counterpartyId', 'counterpartyName', 'description'];

	// UTF BOM for MS EXCEL
	res.write("\ufeff");

	// write header
	res.write(header.map(field => '"' + field + '"').join(";") + '\r\n');

	// write data
	payments.forEach(payment => {
		res.write(makeCSVLine(header.map(field => {
			switch (field) {
				case "eventName":
					return eventIndex[String(payment.event)];
				default:
					return payment[field];
			}
		})));
	});

	res.end();
});

function makeCSVLine(array) {

	// clean and format values
	array = array.map(value => makeCSVItem(value));

	return array.join(";") + "\r\n";
}

function makeCSVItem(value) {

	// number, replace , to . and no quotes
	if (typeof (value) === 'number' || (typeof (value) === 'string' && value.match(/^\d+([\.,]\d+)?$/))) {
		value = value + "";
		return value.replace(",", ".");
	}

	// boolean, replace to binary 0/1
	if (typeof (value) === "boolean") return value ? 1 : 0;

	// empty values
	if (Number.isNaN(value) || value === null) return "";

	// string, escape quotes and encapsulate in quotes
	value = value + "";
	return "\"" + value.replace("\"", "\"\"") + "\"";

}
