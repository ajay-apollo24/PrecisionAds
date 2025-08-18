import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Selector } from '../ui/selector';
import { Textarea } from '../ui/textarea';
import { 
  TrendingUp, 
  Play, 
  Pause, 
  Settings, 
  Plus, 
  Edit, 
  Trash2,
  Brain,
  BarChart3,
  Target,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap
} from 'lucide-react';
import { advancedAlgorithmsService, PredictiveBiddingModel } from '../../services/advanced-algorithms.service';

const PredictiveBiddingManagement: React.FC = () => {
  const [models, setModels] = useState<PredictiveBiddingModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingModel, setEditingModel] = useState<PredictiveBiddingModel | null>(null);
  const [organizationId, setOrganizationId] = useState('demo-org'); // This should come from auth context

  const [formData, setFormData] = useState({
    name: '',
    modelType: 'LINEAR_REGRESSION' as const,
    description: '',
    parameters: {}
  });

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    try {
      setLoading(true);
      const response = await advancedAlgorithmsService.getPredictiveBiddingModels(organizationId);
      setModels(response.models || []);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        // Update existing model
        await advancedAlgorithmsService.updatePredictiveBiddingModel(
          editingModel.id,
          organizationId,
          formData
        );
      } else {
        // Create new model
        await advancedAlgorithmsService.createPredictiveBiddingModel(organizationId, formData);
      }
      
      setShowForm(false);
      setEditingModel(null);
      setFormData({ name: '', modelType: 'LINEAR_REGRESSION', description: '', parameters: {} });
      loadModels();
    } catch (error) {
      console.error('Error saving model:', error);
    }
  };

  const handleEdit = (model: PredictiveBiddingModel) => {
    setEditingModel(model);
    setFormData({
      name: model.name,
      modelType: model.modelType,
      description: model.description || '',
      parameters: model.parameters || {}
    });
    setShowForm(true);
  };

  const handleDelete = async (modelId: string) => {
    if (window.confirm('Are you sure you want to delete this model?')) {
      try {
        await advancedAlgorithmsService.deletePredictiveBiddingModel(modelId, organizationId);
        loadModels();
      } catch (error) {
        console.error('Error deleting model:', error);
      }
    }
  };

  const handleTrain = async (modelId: string) => {
    try {
      // Mock training data - in real app, this would come from user input or file upload
      const trainingData = [
        { bid: 1.5, ctr: 0.02, cpm: 2.5, conversion: 0.001 },
        { bid: 2.0, ctr: 0.025, cpm: 3.0, conversion: 0.0015 },
        { bid: 1.8, ctr: 0.022, cpm: 2.8, conversion: 0.0012 }
      ];
      
      const parameters = {
        learningRate: 0.01,
        epochs: 100,
        batchSize: 32
      };

      await advancedAlgorithmsService.trainPredictiveBiddingModel(
        modelId,
        trainingData,
        parameters,
        organizationId
      );
      loadModels();
    } catch (error) {
      console.error('Error training model:', error);
    }
  };

  const handleEvaluate = async (modelId: string) => {
    try {
      // Mock test data
      const testData = [
        { bid: 1.6, ctr: 0.021, cpm: 2.6, conversion: 0.0011 },
        { bid: 1.9, ctr: 0.024, cpm: 2.9, conversion: 0.0014 }
      ];

      await advancedAlgorithmsService.evaluatePredictiveBiddingModel(
        modelId,
        organizationId,
        testData
      );
      loadModels();
    } catch (error) {
      console.error('Error evaluating model:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'TRAINING':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'INACTIVE':
        return <Pause className="h-4 w-4 text-gray-600" />;
      default:
        return <Settings className="h-4 w-4 text-gray-600" />;
    }
  };

  const getModelTypeIcon = (type: string) => {
    switch (type) {
      case 'LINEAR_REGRESSION':
        return <TrendingUp className="h-4 w-4" />;
      case 'RANDOM_FOREST':
        return <Brain className="h-4 w-4" />;
      case 'GRADIENT_BOOSTING':
        return <BarChart3 className="h-4 w-4" />;
      case 'NEURAL_NETWORK':
        return <Target className="h-4 w-4" />;
      default:
        return <Settings className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Predictive Bidding Management</h1>
          <p className="text-gray-600 mt-2">
            Manage machine learning models for bid prediction
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          New Model
        </Button>
      </div>

      {/* Model Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingModel ? 'Edit Model' : 'Create New Model'}
            </CardTitle>
            <CardDescription>
              Configure predictive bidding model parameters
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Model Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter model name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="modelType">Model Type</Label>
                  <Selector
                    value={formData.modelType}
                    onValueChange={(value: any) => setFormData({ ...formData, modelType: value })}
                    options={[
                      { value: 'LINEAR_REGRESSION', label: 'Linear Regression' },
                      { value: 'RANDOM_FOREST', label: 'Random Forest' },
                      { value: 'GRADIENT_BOOSTING', label: 'Gradient Boosting' },
                      { value: 'NEURAL_NETWORK', label: 'Neural Network' }
                    ]}
                    placeholder="Select model type"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter model description"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setEditingModel(null);
                    setFormData({ name: '', modelType: 'LINEAR_REGRESSION', description: '', parameters: {} });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingModel ? 'Update Model' : 'Create Model'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Models List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Predictive Bidding Models
          </CardTitle>
          <CardDescription>
            {models.length} models found
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {models.map((model) => (
              <div key={model.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-4">
                  {getModelTypeIcon(model.modelType)}
                  <div>
                    <h4 className="font-medium">{model.name}</h4>
                    <p className="text-sm text-gray-600">
                      Type: {model.modelType}
                      {model.description && ` • ${model.description}`}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>Accuracy: {model.accuracy?.toFixed(2)}%</span>
                      <span>Training Time: {model.trainingTime}s</span>
                      <span>Epochs: {model.epochs}</span>
                      <span>Loss: {model.loss?.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {getStatusIcon(model.status)}
                    <Badge className="ml-1">
                      {model.status}
                    </Badge>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTrain(model.id)}
                      disabled={model.status === 'TRAINING'}
                      title="Train Model"
                    >
                      <Brain className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEvaluate(model.id)}
                      title="Evaluate Model"
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(model)}
                      title="Edit Model"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(model.id)}
                      className="text-red-600 hover:text-red-700"
                      title="Delete Model"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            
            {models.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No predictive bidding models found. Create your first model to get started.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveBiddingManagement; 