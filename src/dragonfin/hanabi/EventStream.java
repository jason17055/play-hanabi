package dragonfin.hanabi;

import java.util.*;

public class EventStream
{
	ArrayDeque<HanabiEvent> events = new ArrayDeque<HanabiEvent>();
	int nextEventNumber = 1;
	boolean streamClosed = false;

	public synchronized void push(HanabiEvent evt)
	{
		evt.id = (nextEventNumber++);
		events.add(evt);
		notifyAll();
	}

	public synchronized int getNextId()
	{
		return nextEventNumber;
	}

	public synchronized HanabiEvent getEvent(int tid)
		throws EventNotFound
	{
		while (!streamClosed)
		{
			if (!events.isEmpty()) {
				if (tid <= events.getLast().id) {
					// return the desired event
					for (HanabiEvent evt : events) {
						if (evt.id == tid) {
							return evt;
						}
					}
					throw new EventNotFound(tid);
				}
			}

			try {
				wait();
			}
			catch (InterruptedException e) {}
		}

		assert streamClosed;
		throw new EventNotFound(tid);
	}

	public synchronized void close()
	{
		streamClosed = true;
		notifyAll();
	}

	static class EventNotFound extends Exception
	{
		public EventNotFound(int eventId)
		{
			super("Event "+eventId+" not found in stream.");
		}
	}
}
