export default function CandidateCard({ userName, setUserName, userId, setUserId }) {
  return (
    <div className="candidate-card">
      <div className="input-group">
        <label>Candidate Name</label>
        <input
          type="text"
          className="minimal-input"
          placeholder="Enter your full name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />
      </div>
      <div className="input-group">
        <label>Student ID</label>
        <input
          type="text"
          className="minimal-input"
          placeholder="Enter your student ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
        />
      </div>
    </div>
  );
}
