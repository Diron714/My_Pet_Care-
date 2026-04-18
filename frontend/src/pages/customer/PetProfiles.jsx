import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../../components/layout/Layout';
import Loading from '../../components/common/Loading';
import EmptyState from '../../components/common/EmptyState';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import api from '../../services/api';
import { getImageSrc, PLACEHOLDER_IMAGE } from '../../utils/helpers';
import { Plus, Edit, Trash2, Eye, PawPrint, User, Calendar, Heart, Syringe, Utensils } from 'lucide-react';
import toast from 'react-hot-toast';

const PetProfiles = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPet, setSelectedPet] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const response = await api.get('/customer-pets');
      setPets(response.data.data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (petId) => {
    try {
      setDeleteLoading(true);
      await api.delete(`/customer-pets/${petId}`);
      toast.success('Pet profile deleted');
      loadPets();
    } catch (error) {
      toast.error('Failed to delete pet profile');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  };

  const handleViewDetails = async (petId) => {
    try {
      const response = await api.get(`/customer-pets/${petId}`);
      setSelectedPet(response.data.data);
      setShowDetails(true);
    } catch (error) {
      console.error('Error loading pet details:', error);
      toast.error('Failed to load pet details');
    }
  };

  if (loading) return <Layout><Loading /></Layout>;

  return (
    <Layout>
      <div className="page-shell">

        {pets.length === 0 ? (
          <div className="card">
            <EmptyState
              icon={PawPrint}
              title="No pet profiles"
              message="Add your first pet profile to get started"
              action={
                <Link to="/customer/pet-profiles/new">
                  <Button className="!bg-slate-800 hover:!bg-slate-900">Add Pet Profile</Button>
                </Link>
              }
            />
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center">
                  <PawPrint className="w-6 h-6 text-slate-600" />
                </div>
                <h2 className="text-xl font-black text-slate-800">My Pets</h2>
              </div>
              <Link to="/customer/pet-profiles/new">
                <Button className="!bg-slate-800 hover:!bg-slate-900 !rounded-xl">
                  <Plus className="w-4 h-4 inline mr-2" />
                  Add New Pet
                </Button>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet) => (
              <div key={pet.customer_pet_id} className="card hover:shadow-xl transition-all duration-300 border-l-4 border-l-slate-600 overflow-hidden">
                <div className="relative h-56 overflow-hidden rounded-t-2xl">
                  {pet.image_url ? (
                    <img
                      src={getImageSrc(pet.image_url)}
                      alt={pet.name}
                      className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.src = PLACEHOLDER_IMAGE;
                      }}
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center">
                      <PawPrint className="w-20 h-20 text-slate-600 opacity-50" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent rounded-t-2xl" />
                </div>
                <div className="p-5">
                  <h3 className="font-bold text-xl text-slate-900 mb-2">{pet.name}</h3>
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <PawPrint className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{pet.species} - {pet.breed}</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">{pet.age} months old</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <User className="w-4 h-4 text-slate-400" />
                      <span className="text-sm capitalize">{pet.gender}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4 border-t border-slate-100">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewDetails(pet.customer_pet_id)}
                      className="flex-1"
                    >
                      <Eye className="w-4 h-4 inline mr-1" />
                      View
                    </Button>
                    <Link to={`/customer/pet-profiles/${pet.customer_pet_id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="w-4 h-4 inline mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(pet)}
                    >
                      <Trash2 className="w-4 h-4 inline mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

        {/* Pet Details Modal */}
        {showDetails && selectedPet && (
          <Modal
            isOpen={showDetails}
            onClose={() => setShowDetails(false)}
            title={selectedPet.name}
            size="lg"
          >
            <div className="space-y-5">
              {selectedPet.image_url && (
                <div className="relative h-48 rounded-xl overflow-hidden border-2 border-slate-200">
                  <img
                    src={getImageSrc(selectedPet.image_url)}
                    alt={selectedPet.name}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      e.target.src = PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <PawPrint className="w-5 h-5 text-blue-600" />
                    <p className="font-bold text-blue-900">Species</p>
                  </div>
                  <p className="text-blue-700">{selectedPet.species}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="w-5 h-5 text-purple-600" />
                    <p className="font-bold text-purple-900">Breed</p>
                  </div>
                  <p className="text-purple-700">{selectedPet.breed}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-emerald-600" />
                    <p className="font-bold text-emerald-900">Age</p>
                  </div>
                  <p className="text-emerald-700">{selectedPet.age} months</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-5 h-5 text-amber-600" />
                    <p className="font-bold text-amber-900">Gender</p>
                  </div>
                  <p className="text-amber-700 capitalize">{selectedPet.gender}</p>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          isOpen={!!deleteTarget}
          title="Delete pet profile"
          message={
            deleteTarget
              ? `Are you sure you want to delete pet profile "${deleteTarget.name}"?`
              : ''
          }
          confirmLabel="Delete"
          confirmVariant="danger"
          loading={deleteLoading}
          onCancel={() => {
            if (deleteLoading) return;
            setDeleteTarget(null);
          }}
          onConfirm={() => deleteTarget && handleDelete(deleteTarget.customer_pet_id)}
        />
      </div>
    </Layout>
  );
};

export default PetProfiles;
