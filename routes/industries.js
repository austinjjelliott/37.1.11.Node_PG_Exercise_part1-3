const db = require("../db");
const express = require("express");
const ExpressError = require("../expressError");
const router = express.Router();

router.get("/", async function (req, res, next) {
  try {
    const result = await db.query(`
        SELECT industry.code, industry.industry, ic.company_code
         FROM industry
         JOIN industries_companies AS ic ON ic.industry_code = industry.code
         `);
    return res.json({ industry: result.rows });
  } catch (err) {
    return next(err);
  }
});

router.post("/", async function (req, res, next) {
  try {
    if (!req.body.code || !req.body.industry) {
      throw new ExpressError("Both Code And Industry Are Required", 400);
    }
    const result = await db.query(
      `
        INSERT INTO industry
        (code, industry)
        VALUES ($1, $2)
        RETURNING code, industry`,
      [req.body.code, req.body.industry]
    );
    return res.status(201).json({ industry: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

router.post("/joining", async function (req, res, next) {
  try {
    if (!req.body.industry_code || !req.body.company_code) {
      throw new ExpressError(
        "Both industry_code and company_code required",
        400
      );
    }
    const result = await db.query(
      `
        INSERT INTO industries_companies
        (industry_code, company_code)
        VALUES ($1, $2)
        RETURNING industry_code, company_code`,
      [req.body.industry_code, req.body.company_code]
    );
    return res.status(201).json({ industries_companies: result.rows[0] });
  } catch (err) {
    return next(err);
  }
});

// HAVE TO EXPORT ROUTER FOR APP TO USE IT!
module.exports = router;
