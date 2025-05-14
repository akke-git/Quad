import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import Navbar from '../../../components/Navbar';

export default function EditUser() {
  const router = useRouter();
  const { id } = router.query;
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    display_name: '',
    handicap: ''
  });
  const [profileImage, setProfileImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return;
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/golf/users/${id}`);
        const result = await res.json();
        if (!res.ok) throw new Error(result.message);
        const user = result.data;
        setFormData({
          username: user.username || '',
          email: user.email || '',
          password: '',
          confirmPassword: '',
          display_name: user.display_name || '',
          handicap: user.handicap || ''
        });
        if (user.profile_image) setPreviewUrl(user.profile_image);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (formData.password !== formData.confirmPassword) {
      setError('Password does not match.');
      return;
    }
    setIsLoading(true);
    try {
      const submitData = new FormData();
      submitData.append('email', formData.email);
      if (formData.password) submitData.append('password', formData.password);
      submitData.append('display_name', formData.display_name);
      submitData.append('handicap', formData.handicap);
      if (profileImage) submitData.append('profile_image', profileImage);

      const response = await fetch(`/api/golf/users/${id}`, {
        method: 'PUT',
        body: submitData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      router.push('/golf/users/users');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!id) return null;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>User Edit | Sveltt Golf</title>
        <meta name="description" content="User edit page" />
      </Head>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/golf/users/users" className="text-green-400 hover:text-green-300 mb-4 inline-block font-ubuntu-mono">
            &larr; User list
          </Link>
          <h1 className="text-3xl font-bold text-green-400 mt-4 mb-6 font-ubuntu-mono">User Edit</h1>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-6">
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col items-center mb-6">
              <div className="w-40 h-40 rounded-full overflow-hidden bg-gray-700 mb-4">
                {previewUrl ? (
                  <Image src={previewUrl} alt="Profile preview" width={160} height={160} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-5xl">👤</div>
                )}
              </div>
              <label className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md cursor-pointer font-ubuntu-mono">
                Profile image change
                <input type="file" name="profile_image" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-ubuntu-mono">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input type="text" id="username" name="username" value={formData.username} disabled className="bg-gray-700 text-gray-400 border border-gray-600 rounded-md px-3 py-2 w-full" />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">Email *</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">Password *</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">Confirm Password *</label>
                <input type="password" id="confirmPassword" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="display_name" className="block text-sm font-medium text-gray-300 mb-2">Display Name</label>
                <input type="text" id="display_name" name="display_name" value={formData.display_name} onChange={handleChange} className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label htmlFor="handicap" className="block text-sm font-medium text-gray-300 mb-2">Handicap</label>
                <input type="number" id="handicap" name="handicap" value={formData.handicap} onChange={handleChange} className="bg-gray-700 text-white border border-gray-600 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={isLoading} className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md font-ubuntu-mono">
                {isLoading ? 'Updating...' : 'Update'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
