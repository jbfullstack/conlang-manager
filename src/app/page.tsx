// src/app/page.tsx - Fixed version
export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Bienvenue sur Conlang Manager</h1>
          <p className="text-xl text-gray-600 mb-12">
            Gérez votre langue construite de manière collaborative avec l'IA
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📚 Concepts Primitifs</h3>
              <p className="text-gray-600 mb-4">Gérez vos concepts de base et leurs propriétés</p>
              <a
                href="/api/concepts"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                target="_blank"
              >
                Voir l'API →
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔗 Combinaisons</h3>
              <p className="text-gray-600 mb-4">Créez et validez des combinaisons de concepts</p>
              <a
                href="/api/compositions"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                target="_blank"
              >
                Voir l'API →
              </a>
            </div>

            <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🤖 Analyse IA</h3>
              <p className="text-gray-600 mb-4">Utilisez l'IA pour analyser vos créations</p>
              <p className="text-gray-500 text-sm">(Nécessite une clé OpenAI)</p>
            </div>
          </div>

          <div className="mt-12 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">🚀 Status du Système</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-left">
                <p className="font-medium text-blue-800">Base de données :</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>
                    •{' '}
                    <a
                      href="http://localhost:8080"
                      target="_blank"
                      className="underline hover:text-blue-900"
                    >
                      Adminer
                    </a>{' '}
                    - Interface PostgreSQL
                  </li>
                  <li>
                    • <code className="bg-blue-100 px-1 rounded">npm run db:studio</code> - Prisma
                    Studio
                  </li>
                </ul>
              </div>
              <div className="text-left">
                <p className="font-medium text-blue-800">API Tests :</p>
                <ul className="mt-2 space-y-1 text-blue-700">
                  <li>
                    •{' '}
                    <a href="/api/health" target="_blank" className="underline hover:text-blue-900">
                      Health Check
                    </a>
                  </li>
                  <li>
                    •{' '}
                    <a
                      href="/api/concepts"
                      target="_blank"
                      className="underline hover:text-blue-900"
                    >
                      Concepts API
                    </a>
                  </li>
                  <li>
                    •{' '}
                    <a
                      href="/api/compositions"
                      target="_blank"
                      className="underline hover:text-blue-900"
                    >
                      Compositions API
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
