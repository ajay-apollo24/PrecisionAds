import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';

const AdvertiserDashboard: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Advertiser Dashboard
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Campaigns
            </Typography>
            <Typography>Manage your advertising campaigns</Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Analytics
            </Typography>
            <Typography>Track campaign performance and ROI</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AdvertiserDashboard; 