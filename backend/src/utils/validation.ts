import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';
import { ContactCategory } from '@kinect/shared';

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
};

export const contactValidation = {
  create: Joi.object({
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    phoneNumber: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    birthday: Joi.date().allow(null),
    category: Joi.string()
      .valid(...Object.values(ContactCategory))
      .required(),
    customReminderDays: Joi.number().min(1).max(365),
    listId: Joi.string().allow(null),
    notes: Joi.string().max(1000).allow(''),
  }),

  update: Joi.object({
    firstName: Joi.string(),
    lastName: Joi.string(),
    phoneNumber: Joi.string().allow(''),
    email: Joi.string().email().allow(''),
    birthday: Joi.date().allow(null),
    category: Joi.string().valid(...Object.values(ContactCategory)),
    customReminderDays: Joi.number().min(1).max(365),
    listId: Joi.string().allow(null),
    notes: Joi.string().max(1000).allow(''),
    lastContactDate: Joi.date(),
  }),
};

export const listValidation = {
  create: Joi.object({
    name: Joi.string().required(),
    description: Joi.string().max(500).allow(''),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
  }),

  update: Joi.object({
    name: Joi.string(),
    description: Joi.string().max(500).allow(''),
    color: Joi.string().pattern(/^#[0-9A-F]{6}$/i),
    contactIds: Joi.array().items(Joi.string()),
  }),
};

export const validate = (schema: Joi.Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: error.details[0].message,
      });
    }
    next();
  };
};
