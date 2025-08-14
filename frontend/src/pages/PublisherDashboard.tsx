import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

const PublisherDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Publisher Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Sites
            </Typography>
            <Typography>Manage your websites and ad placements</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Earnings
            </Typography>
            <Typography>Track your revenue and performance</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default PublisherDashboard; 