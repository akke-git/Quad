// components/DockerConfigModal.js

export default function DockerConfigModal({ config, onClose }) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-800 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white font-ubuntu-mono">Docker-Compose.yml</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 overflow-auto max-h-[calc(80vh-8rem)]">
            <pre className="bg-gray-900 p-4 rounded text-green-400 font-mono text-sm whitespace-pre-wrap font-ubuntu-mono">
              {config}
            </pre>
          </div>
          <div className="p-4 border-t border-gray-700 flex justify-end">
            <button
              onClick={onClose}
              className="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded transition-colors duration-300 font-ubuntu-mono"
            >
              close
            </button>
          </div>
        </div>
      </div>
    );
  }