const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(`SELECT * FROM invoices`);
    return res.json({ invoices: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      `SELECT invoices.*, companies.* 
        FROM invoices 
        JOIN companies ON invoices.comp_code = companies.code
        WHERE invoices.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `There is no invoice with id of "${req.params.id}"`,
        404
      );
    }
    const invoice = result.rows[0];
    const invoiceData = {
      id: invoice.id,
      amount: invoice.amt,
      paid: invoice.paid,
      addDate: invoice.add_date,
      paidDate: invoice.paid_date,
    };
    const companyData = {
      code: invoice.comp_code,
      name: invoice.name,
      description: invoice.description,
    };

    return res.json({ invoice: invoiceData, company: companyData });
  } catch (err) {
    return next(err);
  }
});

// **POST /invoices :** Adds an invoice. Needs to be passed in JSON body of:
// `{comp_code, amt}`
// Returns: `{invoice: {id, comp_code, amt, paid, add_date, paid_date}}`

router.post("/", async function (req, res, next) {
  try {
    const result = await db.query(
      `
            INSERT INTO invoices
            (comp_code, amt)
            VALUES ($1, $2)
            RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.comp_code, req.body.amt]
    );
    return res.status(201).json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/* 
PUT /invoices/[id] : Updates an invoice. If invoice cannot be found, returns a 404.
Needs to be passed in a JSON body of {amt} 
Returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/
router.put("/:id", async function (req, res, next) {
  try {
    if ("id" in req.body) {
      throw new ExpressError("Not Allowed", 400);
    }
    const result = await db.query(
      `
        UPDATE invoices
        SET amt = $1, paid = $2, paid_date = $3
        WHERE id = $4
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
      [req.body.amt, req.body.paid, req.body.paid_date, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new ExpressError(
        `No invoice found with id = ${req.params.id}`,
        404
      );
    }
    return res.json({ invoice: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

/*
DELETE /invoices/[id] : Deletes an invoice.If invoice cannot be found, returns a
 404. Returns: {status: "deleted"} Also, one route from the previous part should
be updated:
*/
router.delete("/:id", async function (req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM invoices WHERE id = $1 RETURNING id`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `No invoice found with id = ${req.params.id}`,
        404
      );
    }
    return res.json({ status: "deleted" });
  } catch (err) {
    return next(err);
  }
});

// HAVE TO EXPORT ROUTER FOR APP TO USE IT!
module.exports = router;
