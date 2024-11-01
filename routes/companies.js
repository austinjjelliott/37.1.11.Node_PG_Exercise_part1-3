const db = require("../db");
const express = require("express");
const slugify = require("slugify");
const ExpressError = require("../expressError");
const { user } = require("pg/lib/defaults");
const router = express.Router();

router.get("/", async function (req, res, next) {
  try {
    const results = await db.query(
      `SELECT code, name, description FROM companies`
    );
    return res.json({ companies: results.rows });
  } catch (err) {
    return next(err);
  }
});

router.get("/:code", async function (req, res, next) {
  try {
    const userQuery = await db.query(
      `SELECT c.code, c.name, c.description,
              inv.id,inv.amt, inv.paid, inv.add_date, inv.paid_date,
              ind.industry AS industry_name 
        FROM companies AS c
        LEFT JOIN industries_companies AS ic ON c.code = ic.company_code
        LEFT JOIN industry AS ind ON ic.industry_code = ind.code
        LEFT JOIN invoices AS inv ON c.code = inv.comp_code
      WHERE c.code = $1`,
      [req.params.code]
    );
    if (userQuery.rows.length === 0) {
      let notFoundError = new Error(
        `There is no company with code of '${req.params.code}'`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }
    const companyData = {
      code: userQuery.rows[0].code,
      name: userQuery.rows[0].name,
      description: userQuery.rows[0].description,
      industries: userQuery.rows.map((row) => row.industry_name),
      invoices: userQuery.rows.map((row) => ({
        id: row.id,
        amount: row.amt,
        paid: row.paid,
        add_date: row.add_date,
        paid_date: row.paid_date,
      })),
    };
    return res.json({ company: companyData });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    const slugCode = slugify(req.body.name, {
      lower: true,
      strict: true,
    });
    const result = await db.query(
      `INSERT INTO companies (code, name, description) 
            VALUES ($1, $2, $3)
            RETURNING code, name, description`,
      [slugCode, req.body.name, req.body.description]
    );

    return res.status(201).json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.put("/:code", async function (req, res, next) {
  try {
    if ("code" in req.body) {
      throw new ExpressError("Not Allowed", 400);
    }
    const result = await db.query(
      `
        UPDATE companies
        SET name = $1, description = $2
        WHERE code = $3
        RETURNING code, name, description`,
      [req.body.name, req.body.description, req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `There is no company with code of ${req.params.code}`,
        404
      );
    }
    return res.json({ company: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.delete("/:code", async function (req, res, next) {
  try {
    const result = await db.query(
      `DELETE FROM companies WHERE code = $1 RETURNING code`,
      [req.params.code]
    );
    if (result.rows.length === 0) {
      throw new ExpressError(
        `There is no company with code of "${req.params.code}"`,
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

/**Change back to this if needed....THIS IS the route before the "further study" part 
 router.get("/:code", async function (req, res, next) {
  try {
    const userQuery = await db.query(
      `SELECT companies.*, invoices.*
      FROM companies
      JOIN invoices ON companies.code = invoices.comp_code 
      WHERE companies.code = $1`,
      [req.params.code]
    );
    if (userQuery.rows.length === 0) {
      let notFoundError = new Error(
        `There is no company with code of '${req.params.code}'`
      );
      notFoundError.status = 404;
      throw notFoundError;
    }
    const data = userQuery.rows[0];
    const companyData = {
      code: data.code,
      name: data.name,
      description: data.description,
    };
    const invoiceData = {
      id: data.id,
      amount: data.amt,
      paid: data.paid,
      addDate: data.add_date,
      paidDate: data.paid_date,
    };
    return res.json({ company: companyData, invoice: invoiceData });
  } catch (err) {
    return next(err);
  }
});
 */
