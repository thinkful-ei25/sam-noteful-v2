'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();


// GET ALL TAGS
router.get('/', (req, res, next)=>{
  knex.select('id', 'name')
    .from('tags')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

// GET SINGLE TAGS by id

router.get('/:id', (req,res,next)=>{
  const tagId = req.params.id;
  knex.select('id', 'name')
    .from('tags')
    .where('id', tagId)
    .then(result =>{
      if(result){
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err=>next(err));
});


// ========== POST/CREATE ITEM ========== 
router.post('/tags', (req, res, next) => {
  const { name } = req.body;

  /***** Never trust users. Validate input *****/
  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newItem = { name };

  knex.insert(newItem)
    .into('tags')
    .returning(['id', 'name'])
    .then((results) => {
      // Uses Array index solution to get first item in results array
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err => next(err));
});

// ========== PUT/UPDATE A SINGLE ITEM ==========

router.put('/:id', (req,res,next)=>{
  const tagId = req.params.id;
  const {name} = req.body;

  if(!name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateTag = {
    name : name
  };

  knex('tags')
    .update(updateTag)
    .where('id', tagId)
    .returning(['id', 'name'])
    .then(([result])=>{
      if(result){
        res.json(result);
      } else {
        next();
      }
    })
    .catchThrow(err=>next(err));


});

// ======= DELETE A SINGLE ITEM =========

router.delete('/:id', (req, res, next)=>{
  knex.delete()
    .where('id', req.params.id)
    .from('tags')
    .then(()=>{
      res.status(204).end();
    })
    .catch(err=>next(err));
});

module.exports = router;