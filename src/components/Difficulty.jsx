export default function Difficulty({ level }) {
    return (
        <div className="difficulty" role="img" aria-label={`Difficulty ${level} out of 5`}>
            {Array.from({ length: 5 }, (_, index) => (
                <span
                    key={index}
                    aria-hidden="true"
                    className={index < level ? "star active" : "star"}
                >
                    ★
                </span>
            ))}
        </div>
    );
}
