const LandingSearch = () => {
  return (
    <form
      action="/venues"
      method="GET"
      className="grid gap-3 lg:grid-cols-4 items-end">
      <div>
        <label className="text-sm">Type</label>
        <select name="type" className="mt-1 w-full border rounded px-3 py-2">
          <option value="">All</option>
          <option value="TURF">Turf</option>
          <option value="EVENT_SPACE">Event space</option>
        </select>
      </div>

      <div>
        <label className="text-sm">Location</label>
        <input
          name="q"
          className="mt-1 w-full border rounded px-3 py-2"
          placeholder="City / Area (e.g. Gulshan, Dhaka)"
        />
      </div>

      <div>
        <label className="text-sm">Date</label>
        <input
          name="date"
          type="date"
          className="mt-1 w-full border rounded px-3 py-2"
        />
      </div>

      <button className="rounded bg-black text-white px-4 py-2 hover:opacity-90">
        Search
      </button>

      <p className="text-xs text-gray-500 lg:col-span-4">
        Tip: Search sends you to <span className="font-mono">/venues</span> with
        filters applied.
      </p>
    </form>
  );
};

export default LandingSearch;
