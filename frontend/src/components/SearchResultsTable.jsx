// 🡫 Grab the useSearch hook! 🡫
import { useSearch } from "../hooks/useSearch";

function SearchResultsTable(){

    //Put the {fries and stuff} in the bag;
    const { results = [] , status = "loading", errorMsg = "" } = useSearch();


    // 🡫 Show a loading artifact while fetching and rendering results and stuff 🡫
    if (status ==="loading"){
        return (
            <section className="container py-3">
                <p className="text-muted">Loading Records...</p>
            </section>
        );
    };

  if (results.length === 0) {
    return (
      <section className="container py-4 text-start">
        {status === "error" && (
          <div className="text-danger mb-3">Error: {errorMsg}</div>
        )}

        <p className="text-muted">No Records To Display</p>
      </section>
    );
  }

  const headers = Object.keys(results[0]);

  return (
    <section className="container py-4 text-start">
      {status === "error" && (
        <div className="text-danger mb-3">Error: {errorMsg}</div>
      )}

      <div className="table-responsive">
        <table className="table table-striped table-hover text-start">
          <thead>
            <tr>
              {headers.map((header) => (
                <th className="text-start" key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {results.map((record, index) => (
              <tr key={record["User ID"] || index}>
                {headers.map((header) => (
                  <td key={header}>{record[header]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default SearchResultsTable;