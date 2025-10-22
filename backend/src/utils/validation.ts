import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

export const authValidation = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  refreshToken: Joi.object({
    refreshToken: Joi.string().required(),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    password: Joi.string().min(6).required(),
  }),
};

export const contactValidation = {
  create: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    birthday: Joi.date().allow(null),
    customReminderDays: Joi.number().min(1).max(365).allow(null, '').optional(),
    listId: Joi.string().allow(null, '').optional(),
    notes: Joi.string().max(1000).allow(''),
  }),

  update: Joi.object({
    _id: Joi.any().strip(), // Allow but strip _id from updates
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    birthday: Joi.date().allow(null),
    customReminderDays: Joi.number().min(1).max(365).allow(null, '').optional(),
    listId: Joi.string().allow(null, '').optional(),
    notes: Joi.string().max(1000).allow(''),
    lastContactDate: Joi.date(),
    userId: Joi.any().strip(), // Allow but strip userId from updates
    createdAt: Joi.any().strip(), // Allow but strip createdAt from updates
    updatedAt: Joi.any().strip(), // Allow but strip updatedAt from updates
    __v: Joi.any().strip(), // Allow but strip __v from updates
  }),
};

export const listValidation = {
  create: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().max(500).allow(''),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    reminderDays: Joi.number().min(1).max(365).optional(),
  }),

  update: Joi.object({
    _id: Joi.any().strip(), // Allow but strip _id from updates
    name: Joi.string(),
    description: Joi.string().max(500).allow(''),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    reminderDays: Joi.number().min(1).max(365).optional(),
    contactIds: Joi.array().items(Joi.string()),
    userId: Joi.any().strip(), // Allow but strip userId from updates
    createdAt: Joi.any().strip(), // Allow but strip createdAt from updates
    updatedAt: Joi.any().strip(), // Allow but strip updatedAt from updates
    __v: Joi.any().strip(), // Allow but strip __v from updates
    isDefault: Joi.any().strip(), // Allow but strip isDefault from updates
  }),
};

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
      return;
    }
    // Replace req.body with the validated and stripped data
    req.body = value;
    next();
  };
};
