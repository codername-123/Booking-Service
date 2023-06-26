const { StatusCodes } = require("http-status-codes");
const AppError = require("../utils/errors/app-error");

class CrudRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    const response = await this.model.create(data);
    return response;
  }

  async destroy(id) {
    const response = await this.model.destroy({
      where: {
        id: id,
      },
    });
    if (!response) {
      throw new AppError(
        "Not able to find the resource",
        StatusCodes.NOT_FOUND
      );
    }
    return response;
  }

  async get(id) {
    const response = await this.model.findByPk(id);
    if (!response) {
      throw new AppError(
        "Not able to find the resource",
        StatusCodes.NOT_FOUND
      );
    }
    return response;
  }

  async getAll() {
    const response = await this.model.findAll();
    return response;
  }

  async update(id, data) {
    const airplaneAttributes = Object.keys(this.model.rawAttributes);
    const dataKeys = Object.keys(data);
    const hasAttributes = dataKeys.every((datakey) =>
      airplaneAttributes.includes(datakey)
    );
    if (hasAttributes) {
      const response = await this.model.update(data, {
        where: {
          id: id,
        },
      });
      if (!response[0]) {
        throw new AppError(
          "Not able to find the resource",
          StatusCodes.NOT_FOUND
        );
      }
      return response;
    } else {
      throw new AppError(
        "column to be updated is not found",
        StatusCodes.NOT_FOUND
      );
    }
  }
}

module.exports = CrudRepository;
