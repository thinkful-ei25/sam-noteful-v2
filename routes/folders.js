'use strict';

const express = require('express');
const knex = require('../knex');

const router = express.Router();

//get all folders (no search filter)

router.get('/', (req, res, next) => {
  knex.select('id', 'name')
    .from('folders')
    .then(results => {
      res.json(results);
    })
    .catch(err => next(err));
});

//get folder by id

router.get('/:id', (req, res, next) => {
  const noteId = req.params.id;
  knex.select('id', 'name')
    .from('folders')
    .where('id', noteId)
    .then(result =>{
      if(result) {
        res.json(result);
      } else {
        next();
      }
    })
    .catch(err => {
      next(err);
    });
});

//create a folder, accepts an object with a name and inserts it in the DB. Returns the new item along with the new id

router.post('/', (req, res, next)=>{
  const { name } = req.body;

  if(!name){
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const newFolder = {
    name : name
  };

  knex.insert(newFolder)
    .into('folders')
    .returning(['id', 'name'])
    .then((results)=>{
      const result = results[0];
      res.location(`${req.originalUrl}/${result.id}`).status(201).json(result);
    })
    .catch(err =>{
      next(err);
    });

});

//put/update folder

router.put('/:id', (req, res, next)=>{
  const folderId = req.params.id;
  const { name } = req.body;

  if (!name) {
    const err = new Error('Missing `name` in request body');
    err.status = 400;
    return next(err);
  }

  const updateFolder = {
    name : name
  };

  knex('folders')
    .update(updateFolder)
    .where('id', folderId)
    .returning(['id', 'name'])
    .then(([result])=>{
      if(result){
        res.json(result);
      } else {
        next();
      }
    })
    .catchThrow(err =>{
      next(err);
    });

});


//Delete folder by ID, accepts an ID and deletes the folder from the DB and then returns a status 204

router.delete('/:id', (req, res, next)=>{
  knex.del()
    .where('id', req.params.id)
    .from('folders')
    .then(()=>{
      res.status(204).end();
    })
    .catch(err =>{
      next(err);
    });
});


module.exports = router;