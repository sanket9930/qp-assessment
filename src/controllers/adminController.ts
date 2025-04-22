import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { ErrorObject, PGModel, ResponseBody } from "../lib";
import { v4 as uuidv4 } from "uuid";
import { createToken } from "../middelware/auth";

interface UserFromDB {
  id: string;
  email: string;
  password: string;
  role: "User" | "Admin";
}

export interface GroceryItem {
  name: string;
  price: number;
  unit?: string;
  stock: number;
}

const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const query = "SELECT * FROM users WHERE email = $1";
    const result = await PGModel.query<UserFromDB>(query, [email]);

    if (result.rowCount === 0) {
      throw new ErrorObject(401, "Invalid credentials");
    }

    const user: UserFromDB = result.rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch || user.role !== 'Admin') {
      throw new ErrorObject(401, "Invalid credentials");
    }

    const JWT_SECRET = process.env.JWT_SECRET;
    if (!JWT_SECRET) throw new ErrorObject(500, "JWT_SECRET is not set");

    const token = createToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    const responseBody = new ResponseBody(200, { token });
    res.send(responseBody);
  } catch (error: any) {
    throw new ErrorObject(
      error?.statusCode || 500,
      error?.message || "Internal Server Error"
    );
  }
};

const registerAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

    if(!email || !password || !role || !['Admin', 'User'].includes(role) ){
      throw new ErrorObject(400, 'Invalid request body')
    }

    const createTableQuery = `
    create TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(50) DEFAULT 'User',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

    await PGModel.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";', []);
    await PGModel.query(createTableQuery, []);

    const insertQuery = `
  INSERT INTO users (id, email, password, role)
  VALUES ($1, $2, $3, $4);
`;
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const id = uuidv4();
    const result = await PGModel.query(insertQuery, [
      id,
      email,
      hashedPassword,
      role,
    ]);

    const responseBody = new ResponseBody(201, "Registered Successfully");
    res.send(responseBody)
  } catch (error: any) {
    throw new ErrorObject(error?.statusCode || 500, error?.message || 'Internal Server Error')
  }
};

const viewGrocery = async (req: Request, res: Response) => {
  try {
    const result = await PGModel.query("select * from groceries", []);
    const { rows } = result;
    const responseBody = new ResponseBody(200, rows);
    res.send(responseBody);
  } catch (err) {
    throw new ErrorObject(500, "Internal Server Error");
  }
};

const addGrocery = async (req: Request, res: Response) => {
  try {
    const { name, price, unit, stock }: GroceryItem = req.body;

    if (!name || !price || stock === undefined) {
      return res
        .status(400)
        .json({ error: "Missing required fields: name, price, stock" });
    }

    const viewQuery = `SELECT * FROM groceries
    WHERE name = $1`;

    const existingGrocery = await PGModel.query(viewQuery, [
      name.toLowerCase(),
    ]);

    if (existingGrocery.rows.length > 0) {
      throw new ErrorObject(409, "Item with this name already exists");
    }

    const addQuery = `
      INSERT INTO groceries (name, price, unit, stock)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [name.toLowerCase(), price, unit, stock];

    const data = await PGModel.query(addQuery, values);
    const rows = data.rows[0];
    const responseBody = new ResponseBody(201, rows);
    res.send(responseBody);
  } catch (error: any) {
    throw new ErrorObject(error?.statusCode || 500, error?.message || 'Internal Server Error')
  }
};

const removeGrocery = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.query.id as string, 10);

    if (isNaN(id)) {
      throw new ErrorObject(400, 'Invalid or missing ID');
    }

    const checkQuery = `SELECT * FROM groceries WHERE id = $1`;
    const existingItem = await PGModel.query(checkQuery, [id]);

    if (existingItem.rows.length === 0) {
      throw new ErrorObject(404, 'Item with this ID does not exist');
    }

    const deleteQuery = `DELETE FROM groceries WHERE id = $1 RETURNING *`;
    const result = await PGModel.query(deleteQuery, [id]);

    const responseBody = new ResponseBody(200, result.rows[0]);
    return res.send(responseBody);
  } catch (error: any) {
    throw new ErrorObject(error?.statusCode || 500, error?.message || 'Internal Server Error');
  }
};

const modifyGrocery = async ( req: Request, res: Response) => {
  try {
    const { name, price, unit, stock }: GroceryItem = req.body;
    const id = parseInt(req.query.id as string, 10);

    if (!name && !price && stock === undefined && isNaN(id)) {
      throw new ErrorObject(400, "Missing or invalid fields: name, price, stock, or id");
    }

    const viewQuery = `SELECT * FROM groceries WHERE id = $1`;
    const existingGrocery = await PGModel.query(viewQuery, [id]);

    if (existingGrocery.rows.length === 0) {
      throw new ErrorObject(409, 'Item with this ID does not exist')
    }

    const { name: _name, price: _price, unit: _unit, stock: _stock } = existingGrocery.rows[0]

    console.log(_name, _price, _unit, typeof _stock, existingGrocery.rows[0])

    const updatedStock = Number(_stock) + Number(stock ?? 0)
    const updatedName = name || _name
    const updatedPrice = price || _price
    const updatedUnit = unit ?? _unit

    const updateQuery = `
      UPDATE groceries
      SET name = $1, price = $2, unit = $3, stock = $4
      WHERE id = $5
      RETURNING *
    `;

    const values = [updatedName.toLowerCase(), updatedPrice, updatedUnit, updatedStock, id];
    const data = await PGModel.query(updateQuery, values);

    const responseBody = new ResponseBody(200, data.rows[0]);
    return res.send(responseBody);
  } catch (error: any) {
    throw new ErrorObject(error?.statusCode || 500, error?.message || 'Internal Server Error')
  }
};

export const adminController = {
  loginAdmin,
  registerAdmin,
  viewGrocery,
  addGrocery,
  removeGrocery,
  modifyGrocery
}