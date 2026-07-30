import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

export default function ServerErrorPage() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', p: 3 }}>
      <Box sx={{ textAlign: 'center', maxWidth: 560 }}>
        <Typography variant="h2" component="h1" gutterBottom>
          500
        </Typography>
        <Typography variant="h5" gutterBottom>
          Server error
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Something went wrong on the server. Please try again later or contact your administrator.
        </Typography>
        <Button component={Link} to="/" variant="contained" color="primary">
          Return home
        </Button>
      </Box>
    </Box>
  );
}
