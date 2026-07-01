import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FiSun, FiX, FiTrash2 } from "react-icons/fi";
import { HiOutlineSparkles } from "react-icons/hi2";
import { fetchPlans, fetchActivePlan, deletePlan } from "../store/slices/wellnessSlice";
import { fetchHistory } from "../store/slices/historySlice";
import PlanCard from "../components/Wellness/PlanCard";
import ActiveTracking from "../components/Wellness/ActiveTracking";
import WellnessChatModal from "../components/Wellness/WellnessChatModal";

export default function WellnessPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const [viewedPlan, setViewedPlan] = useState(null);

  const { plans, plansStatus, activePlan, chatOpen } =
    useSelector((s) => s.wellness);
  const token = useSelector((s) => s.auth.token);
  const historyItems = useSelector((s) => s.history.items);

  // Same numbering scheme as ReportsPage (chronological, oldest = #1), so a
  // plan's "Report #N" always matches the number shown on that report there.
  const reportNumberById = useMemo(() => {
    const chronological = [...historyItems].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );
    return new Map(chronological.map((it, idx) => [it.id, idx + 1]));
  }, [historyItems]);

  // Guard: must be logged in
  useEffect(() => {
    if (!token) navigate("/login");
  }, [token, navigate]);

  useEffect(() => {
    if (token) {
      dispatch(fetchActivePlan());
      dispatch(fetchPlans());        // fetch ALL plans for user
      dispatch(fetchHistory());      // needed to map each plan back to its report number
    }
  }, [dispatch, token]);

  const handleDeletePlan = (plan, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this plan? This can't be undone.")) return;
    dispatch(deletePlan(plan.id));
    if (viewedPlan?.id === plan.id) setViewedPlan(null);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">

      {/* Page header */}
      <div className="bg-white border-b shadow-sm shrink-0">
        <div className="px-4 md:px-8 py-6 text-center">
          <h1 className="text-2xl md:text-3xl font-black text-gray-900"
            style={{ fontFamily: "Archivo Black, sans-serif" }}>
            Routine & <span className="text-red-600">Diet Plans</span>
          </h1>
          <p className="text-gray-500 text-sm mt-1"
            style={{ fontFamily: "Nunito, sans-serif" }}>
            AI-generated personalised wellness plans based on your heart assessments
          </p>
        </div>
      </div>

      {/* Two panels, both visible at once, full-width with slight margins */}
      <div className="flex-1 min-h-0 px-3 md:px-5 py-4">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">

          {/* ── Left: Current Plan ── */}
          <div className="h-full min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-50 shrink-0">
              <FiSun className="text-red-600" size={17} />
              <h2 className="font-black text-gray-900 text-base"
                style={{ fontFamily: "Archivo Black, sans-serif" }}>
                Current Plan
              </h2>
              {activePlan && (
                <span className="w-2 h-2 rounded-full bg-green-400 ml-auto" />
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              {activePlan ? (
                <>
                  {reportNumberById.has(activePlan.report_id) && (
                    <p className="text-xs text-gray-400 font-semibold mb-3"
                      style={{ fontFamily: "Nunito, sans-serif" }}>
                      From Report #{reportNumberById.get(activePlan.report_id)}
                    </p>
                  )}
                  <ActiveTracking />
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center py-10">
                  <FiSun className="text-4xl text-gray-200 mb-3" />
                  <p className="font-medium text-gray-500"
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    No active plan
                  </p>
                  <p className="text-sm text-gray-400 mt-1"
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    Activate one of your plans to start tracking it here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Right: My Plans ── */}
          <div className="h-full min-h-0 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <h2 className="font-black text-gray-900 text-base"
                style={{ fontFamily: "Archivo Black, sans-serif" }}>
                My Plans
              </h2>
              <p className="text-xs text-gray-400"
                style={{ fontFamily: "Nunito, sans-serif" }}>
                Generate one from a report in Reports
              </p>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              {plansStatus === "loading" && (
                <p className="text-center text-gray-400 py-10"
                  style={{ fontFamily: "Nunito, sans-serif" }}>Loading plans...</p>
              )}

              {plansStatus === "succeeded" && plans.length === 0 && (
                <div className="text-center text-gray-400 py-16"
                  style={{ fontFamily: "Nunito, sans-serif" }}>
                  <HiOutlineSparkles className="text-4xl text-gray-200 mx-auto mb-2" />
                  <p className="font-medium text-gray-500">No plans yet</p>
                  <p className="text-sm mt-1">Save a prediction report first, then generate a plan from it.</p>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {plans.map((plan) => {
                  const isActive = activePlan?.id === plan.id;
                  return (
                    <div key={plan.id}
                      className={`w-full flex items-center gap-4 rounded-2xl border bg-white px-5 py-4 transition-shadow hover:shadow-md ${
                        isActive ? "border-red-200" : "border-gray-100"
                      }`}>

                      <div className="w-1.5 self-stretch rounded-full bg-gradient-to-b from-red-500 to-red-300 shrink-0" />

                      <div className="flex-1 min-w-0 flex flex-wrap items-center gap-2">
                        {reportNumberById.has(plan.report_id) && (
                          <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-bold"
                            style={{ fontFamily: "Nunito, sans-serif" }}>
                            Report #{reportNumberById.get(plan.report_id)}
                          </span>
                        )}
                        {isActive && (
                          <span className="flex items-center gap-1 px-2 py-1 rounded-md bg-green-50 text-green-600 text-[11px] font-bold"
                            style={{ fontFamily: "Nunito, sans-serif" }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                            Active
                          </span>
                        )}
                        {plan.created_at && (
                          <span className="text-xs text-gray-400"
                            style={{ fontFamily: "Nunito, sans-serif" }}>
                            {new Date(plan.created_at).toLocaleDateString(undefined, {
                              year: "numeric", month: "short", day: "numeric",
                            })}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => setViewedPlan(plan)}
                        className="shrink-0 px-4 py-2 rounded-lg text-red-600 text-xs font-bold border border-red-100 hover:bg-red-50 transition-colors"
                        style={{ fontFamily: "Nunito, sans-serif" }}>
                        View Plan
                      </button>
                      <button
                        onClick={(e) => handleDeletePlan(plan, e)}
                        className="shrink-0 p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Delete plan">
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Questionnaire modal */}
      {chatOpen && <WellnessChatModal />}

      {/* View Plan modal — blurs the page behind it, no route change */}
      {viewedPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4"
          onClick={() => setViewedPlan(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 shrink-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-gray-900 text-base"
                  style={{ fontFamily: "Archivo Black, sans-serif" }}>
                  Plan Details
                </h3>
                {reportNumberById.has(viewedPlan.report_id) && (
                  <span className="px-2 py-1 rounded-md bg-red-50 text-red-600 text-[11px] font-bold"
                    style={{ fontFamily: "Nunito, sans-serif" }}>
                    Report #{reportNumberById.get(viewedPlan.report_id)}
                  </span>
                )}
              </div>
              <button onClick={() => setViewedPlan(null)}
                className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
              <PlanCard plan={viewedPlan} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}