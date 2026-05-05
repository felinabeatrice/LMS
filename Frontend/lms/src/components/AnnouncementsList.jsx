import { Megaphone, Calendar, User, BookOpen } from 'lucide-react';

const AnnouncementsList = ({ announcements, title = 'Announcements', emptyMessage = 'No announcements yet' }) => {
  const formatDate = (d) => new Date(d).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <Megaphone size={16} className="text-blue-600" />
        </div>
        <h2 className="font-bold text-gray-900">{title}</h2>
        <span className="text-xs text-gray-400 ml-auto">
          {announcements.length} total
        </span>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-10">
          <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center
                          justify-center mx-auto mb-3">
            <Megaphone size={24} className="text-gray-400" />
          </div>
          <p className="text-gray-500 text-sm">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
          {announcements.map((a) => (
            <div
              key={a.id}
              className="border border-gray-200 rounded-xl p-4
                         hover:border-blue-200 hover:bg-blue-50/30
                         transition-colors"
            >
              <div className="flex items-start gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center
                                justify-center flex-shrink-0 mt-0.5">
                  <Megaphone size={14} className="text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm mb-1">
                    {a.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed
                                whitespace-pre-line">
                    {a.content}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400
                              ml-11 flex-wrap">
                <div className="flex items-center gap-1">
                  <User size={11} />
                  <span>{a.creator?.name}</span>
                </div>
                {a.course && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <BookOpen size={11} />
                    <span>{a.course.title}</span>
                  </div>
                )}
                <div className="flex items-center gap-1">
                  <Calendar size={11} />
                  <span>{formatDate(a.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnnouncementsList;