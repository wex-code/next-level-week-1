import knex from "../database/connection";
import { Request, Response } from "express";

class PointsController {
  async index(request: Request, response: Response) {
    const { city, uf, items } = request.query;

    const parsedItems = String(items)
      .split(",")
      .map((item) => Number(item.trim()));

    const points = await knex("points")
      .join("point_items", "points.id", "=", "point_items.points_id")
      .whereIn("point_items.items_id", parsedItems)
      .where("city", String(city))
      .where("uf", String(uf))
      .distinct()
      .select("points.*");

    const serializedPoints = points.map((point) => {
      return {
        ...point,
        image_url: `http://192.168.15.11:3333/uploads/${point.image}`,
      };
    });
    return response.json(serializedPoints);
  }

  async show(request: Request, response: Response) {
    const { id } = request.params;

    const point = await knex("points").where("id", id).first();

    if (!point) {
      return response.status(400).json({ message: "Point not fould." });
    }

    const serializedPoint = {
      ...point,
      image_url: `http://192.168.15.11:3333/uploads/${point.image}`,
    };

    const items = await knex("items")
      .join("point_items", "items.id", "=", "point_items.items_id")
      .where("point_items.points_id", id)
      .select("items.title");

    return response.json({ point: serializedPoint, items });
  }
  async create(request: Request, response: Response) {
    const {
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
      items,
    } = request.body;

    const trx = await knex.transaction();
    const point = {
      image: request.file.filename,
      name,
      email,
      whatsapp,
      latitude,
      longitude,
      city,
      uf,
    };

    const insertedIds /*resultado é o id do ponto*/ = await trx(
      "points"
    ).insert(point);

    const points_id = insertedIds[0];

    const pointItems = items
      .split(",")
      .map((item: string) => Number(item.trim()))
      .map((items_id: number) => {
        return {
          items_id,
          points_id,
        };
      });
    await trx("point_items").insert(pointItems);

    await trx.commit();

    return response.json({
      id: points_id,
      ...point,
    });
  }
}

export default PointsController;