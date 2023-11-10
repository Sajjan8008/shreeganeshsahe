import Joi from 'joi';

// Login validation
export const loginSchema = Joi.object().keys({
  username: Joi.string().trim().required(),
  password: Joi.string().trim().required(),
  appversion: Joi.string().trim()
});


// Add user validation
export const addUserSchema = Joi.object().keys({
  username: Joi.string().required(),
  password: Joi.string().trim().required(),
  role: Joi.number().required(),
  
}).options({ allowUnknown: true });

// Add game validation
export const gameSchema = Joi.object().keys({
  name: Joi.string().trim().required(),
  status: Joi.boolean().required(),
});

// Update game status
export const updateStatus = Joi.object().keys({
  status: Joi.boolean().required(),
});

// Add betting type
export const addBettingType = Joi.object().keys({
  name: Joi.string().required(),
  description: Joi.string(),
  category: Joi.string().required(),
  winning_x: Joi.number().required(),
  game: Joi.string().required(),
  status: Joi.boolean().required()
});

// Update betting type
export const updateBettingType = Joi.object().keys({
  description: Joi.string(),
  winning_x: Joi.number(),
  status: Joi.boolean()
});

// Update betting type
export const updateBetting = Joi.object().keys({
  token: Joi.array(),
  amount: Joi.number(),
});


// Insert betting
export const insertRouletteBetting = Joi.object().keys({
  user: Joi.string(),// temp added

  name: Joi.string().trim().required(),
  amount: Joi.number().required().min(1),
  numbers: Joi.array().required(),
  betting_type: Joi.string().trim().required(),
  tokens: Joi.array()
});

// Add user validation
export const addUsersSchema = Joi.object().keys({
  username: Joi.string().min(5).max(50).required(),
  password: Joi.string().min(5).max(255).required(),
  phone: Joi.string().min(10).max(10).required(),
  email: Joi.string().min(5).max(50)
}).options({ allowUnknown: true });