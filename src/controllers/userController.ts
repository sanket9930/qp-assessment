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

interface OrderItem {
  id: number;
  quantity: number;
}

interface OrderRequestBody {
  items: OrderItem[];
}

interface OrderedItemSummary {
  id: number;
  name: string;
  ordered: number;
  remaining: number;
  pricePerUnit: number;
  total: number;
}

const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  const query = "SELECT * FROM users WHERE email = $1";
  const result = await PGModel.query<UserFromDB>(query, [email]);

  if (result.rowCount === 0) {
    throw new ErrorObject(401, "Invalid credentials");
  }

  const user: UserFromDB = result.rows[0];

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch || user.role !== "User") {
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
};

const registerUser = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;

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

    return new ResponseBody(200, "Registered Successfully");
  } catch (error) {
    throw new ErrorObject(500, error);
  }
};

const viewGrocery = async (req: Request, res: Response) => {
  try {
    const query = `SELECT * FROM groceries ORDER BY name ASC`;
    const result = await PGModel.query(query);

    const responseBody = new ResponseBody(200, result.rows);
    return res.send(responseBody);
  } catch (error: any) {
    throw new ErrorObject(500, "Failed to fetch groceries");
  }
};

const placeOrder = async (
  req: Request<{}, {}, OrderRequestBody>,
  res: Response
) => {
  try {
    await PGModel.query("BEGIN");
    const { items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new ErrorObject(400, "Invalid or empty order items");
    }

    const orderSummary: OrderedItemSummary[] = [];
    let totalCost = 0;

    for (const { id, quantity } of items) {
      if (!id || !quantity || quantity <= 0) {
        throw new ErrorObject(
          400,
          "Each item must have a valid id and positive quantity"
        );
      }

      const selectQuery = `SELECT * FROM groceries WHERE id = $1`;
      const existingItem = await PGModel.query(selectQuery, [id]);

      if (existingItem.rows.length === 0) {
        throw new ErrorObject(404, `Item with ID ${id} does not exist`);
      }

      const grocery = existingItem.rows[0];

      if (grocery.stock < quantity) {
        throw new ErrorObject(400, `Insufficient stock for item: ${grocery.name}`);
      }

      const itemTotal = parseFloat(grocery.price) * quantity;
      totalCost += itemTotal;

      const updatedStock = grocery.stock - quantity;
      const updateQuery = `UPDATE groceries SET stock = $1 WHERE id = $2`;
      await PGModel.query(updateQuery, [updatedStock, id]);

      orderSummary.push({
        id: grocery.id,
        name: grocery.name,
        ordered: quantity,
        remaining: updatedStock,
        pricePerUnit: parseFloat(grocery.price),
        total: itemTotal,
      });
    }

    // Save the order in orders table
    const insertOrderQuery = `
        INSERT INTO orders (items, total_cost)
        VALUES ($1, $2)
        RETURNING *;
      `;
    const orderResult = await PGModel.query(insertOrderQuery, [
      JSON.stringify(orderSummary),
      totalCost,
    ]);

    const responseBody = new ResponseBody(200, {
      message: "Order placed successfully",
      orderId: orderResult.rows[0].id,
      totalCost,
      items: orderSummary,
    });

    await PGModel.query("COMMIT");
    return res.send(responseBody);
  } catch (error: any) {
    await PGModel.query("ROLLBACK");
    throw new ErrorObject(error?.statusCode || 500, error?.message || "Failed to place order");
  } finally {
    await PGModel.release();
  }
};

export const userController = {
  loginUser,
  registerUser,
  viewGrocery,
  placeOrder,
};
