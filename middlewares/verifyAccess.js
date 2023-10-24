import jwt from 'jsonwebtoken';

export default (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log('token:', token);

    try {
      const decoded = jwt.verify(token, 'mySecret');
      next();
    } catch(err) {
      res.status(401).json({'error': 401, 'message': 'invalid token'})
    }
  } else {
    res.status(403).json({'error': 403, 'message': 'authorization header not found'});
  }
}
