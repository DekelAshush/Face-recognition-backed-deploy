const handleProfileGet = (req, res, db) => {
    const { id } = req.params;
    db.select('*').from('users').where({ id })
        .then(user => user.length ? res.json(user[0]) : res.status(400).json('Not found'))
        .catch(() => res.status(400).json('error getting user'));
};

const handleProfileUpdate = (req, res, db) => {
    const { id } = req.params;
    const { name, age, pet } = req.body;

    db('users').where({ id })
        .update({ name, age, pet })
        .then(resp => resp ? res.json('success') : res.status(400).json('Unable to update'))
        .catch(() => res.status(400).json('error updating user'));
};

export { handleProfileGet, handleProfileUpdate };
