import React from 'react';
import { Box, Typography, Grid, Paper, Card, CardContent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome to Precision Ads
      </Typography>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              User Information
            </Typography>
            <Typography>Name: {user?.firstName} {user?.lastName}</Typography>
            <Typography>Email: {user?.email}</Typography>
            <Typography>Role: {user?.role}</Typography>
            {user?.organization && (
              <Typography>Organization: {user.organization.name}</Typography>
            )}
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Typography>• View Analytics</Typography>
            <Typography>• Manage Campaigns</Typography>
            <Typography>• Update Settings</Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; 